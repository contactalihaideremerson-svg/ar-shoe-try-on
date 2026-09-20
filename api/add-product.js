import { get } from "@vercel/blob";

const GITHUB_API = "https://api.github.com";

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function getGithubFile(path) {
  const url =
    `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` +
    `/contents/${path}`;

  const response = await fetch(url, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function saveGithubFile(path, contentBase64, message, sha) {
  const url =
    `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` +
    `/contents/${path}`;

  const body = {
    message,
    content: contentBase64,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${response.status} ${text}`);
  }

  return response.json();
}

function safeFilename(filename) {
  return filename
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      name,
      price,
      description,
      imageBase64,
      imageName,
      effectBlobPathname,
      effectName,
    } = req.body || {};

    if (!name || !price || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, price and description are required.",
      });
    }

    if (!imageBase64 || !imageName) {
      return res.status(400).json({
        success: false,
        message: "Product image is required.",
      });
    }

    if (!effectBlobPathname || !effectName) {
      return res.status(400).json({
        success: false,
        message: "DeepAR effect is required.",
      });
    }

    if (!effectName.toLowerCase().endsWith(".deepar")) {
      return res.status(400).json({
        success: false,
        message: "Only .deepar files are allowed.",
      });
    }

    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (!process.env.GITHUB_TOKEN || !githubOwner || !githubRepo) {
      throw new Error("GitHub environment variables are not configured.");
    }

    /*
     * ---------------------------------------------------------
     * 1. Get DeepAR file from private Vercel Blob
     * ---------------------------------------------------------
     */

    const blobResult = await get(effectBlobPathname, {
      access: "private",
    });

    if (!blobResult) {
      throw new Error("DeepAR file was not found in Vercel Blob.");
    }

    const effectArrayBuffer = await new Response(
      blobResult.stream
    ).arrayBuffer();

    const effectBase64 = Buffer.from(effectArrayBuffer).toString("base64");

    /*
     * ---------------------------------------------------------
     * 2. Create safe filenames
     * ---------------------------------------------------------
     */

    const cleanImageName = safeFilename(imageName);
    const cleanEffectName = safeFilename(effectName);

    const imagePath = `public/assets/${Date.now()}-${cleanImageName}`;
    const effectPath = `public/effects/${cleanEffectName}`;

    /*
     * ---------------------------------------------------------
     * 3. Upload product image to GitHub
     * ---------------------------------------------------------
     */

    await saveGithubFile(
      imagePath,
      imageBase64,
      `Add product image: ${name}`
    );

    /*
     * ---------------------------------------------------------
     * 4. Upload DeepAR effect to GitHub
     * ---------------------------------------------------------
     */

    const existingEffect = await getGithubFile(effectPath);

    await saveGithubFile(
      effectPath,
      effectBase64,
      `Add DeepAR effect: ${name}`,
      existingEffect?.sha
    );

    /*
     * ---------------------------------------------------------
     * 5. Read products.json
     *
     * IMPORTANT:
     * Actual source file is:
     * public/data/products.json
     * ---------------------------------------------------------
     */

    const productsPath = "public/data/products.json";

    const existingProductsFile = await getGithubFile(productsPath);

    let products = [];

    if (existingProductsFile?.content) {
      const decoded = Buffer.from(
        existingProductsFile.content,
        "base64"
      ).toString("utf8");

      try {
        products = JSON.parse(decoded);
      } catch {
        products = [];
      }
    }

    if (!Array.isArray(products)) {
      products = [];
    }

    /*
     * ---------------------------------------------------------
     * 6. Create product object
     * ---------------------------------------------------------
     */

    const id =
      `${name.toLowerCase()}-${Date.now()}`
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const product = {
      id,
      name,
      price,
      description,
      image: imagePath.replace(/^public\//, ""),
      effect: effectPath.replace(/^public\//, ""),
    };

    products.push(product);

    /*
     * ---------------------------------------------------------
     * 7. Save products.json back to GitHub
     * ---------------------------------------------------------
     */

    const productsContent = JSON.stringify(products, null, 2);

    const productsBase64 =
      Buffer.from(productsContent, "utf8").toString("base64");

    await saveGithubFile(
      productsPath,
      productsBase64,
      `Add product: ${name}`,
      existingProductsFile?.sha
    );

    /*
     * ---------------------------------------------------------
     * 8. Response
     * ---------------------------------------------------------
     */

    return res.status(200).json({
      success: true,
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to add product.",
    });
  }
}