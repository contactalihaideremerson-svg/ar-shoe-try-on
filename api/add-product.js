import { put } from "@vercel/blob";

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
      effectBlobUrl,
      effectName,
    } = req.body || {};

    if (
      !name ||
      !price ||
      !description ||
      !imageBase64 ||
      !imageName ||
      !effectBlobUrl ||
      !effectName
    ) {
      return res.status(400).json({
        success: false,
        message: "All product fields are required.",
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return res.status(500).json({
        success: false,
        message: "GitHub environment variables are not configured.",
      });
    }

    const githubHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const productId = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Invalid product name.",
      });
    }

    const cleanImageName = imageName
      .split("\\")
      .pop()
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    const cleanEffectName = effectName
      .split("\\")
      .pop()
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    if (!cleanEffectName.toLowerCase().endsWith(".deepar")) {
      return res.status(400).json({
        success: false,
        message: "Effect file must be a .deepar file.",
      });
    }

    async function githubRequest(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...githubHeaders,
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `GitHub API error: ${response.status}`
        );
      }

      return data;
    }

    const githubBase =
      `https://api.github.com/repos/${owner}/${repo}`;

    /*
     * 1. Upload product image to GitHub
     */
    const imagePath =
      `public/assets/${cleanImageName}`;

    await githubRequest(
      `${githubBase}/contents/${imagePath}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Add product image: ${name}`,
          content: imageBase64,
          branch: "main",
        }),
      }
    );

    /*
     * 2. Download .deepar from Blob
     */
    const blobResponse = await fetch(effectBlobUrl);

    if (!blobResponse.ok) {
      throw new Error(
        "Could not download DeepAR effect from Blob storage."
      );
    }

    const effectArrayBuffer =
      await blobResponse.arrayBuffer();

    /*
     * Convert binary effect to Base64
     */
    const effectBase64 =
      Buffer.from(effectArrayBuffer).toString("base64");

    /*
     * 3. Upload .deepar to GitHub
     */
    const effectPath =
      `public/effects/${cleanEffectName}`;

    await githubRequest(
      `${githubBase}/contents/${effectPath}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Add DeepAR effect: ${name}`,
          content: effectBase64,
          branch: "main",
        }),
      }
    );

    /*
     * 4. Read products.json
     */
    const productsFile =
      await githubRequest(
        `${githubBase}/contents/data/products.json?ref=main`
      );

    const existingProducts =
      JSON.parse(
        Buffer.from(
          productsFile.content,
          "base64"
        ).toString("utf-8")
      );

    /*
     * 5. Prevent duplicate products
     */
    if (
      existingProducts.some(
        (product) => product.id === productId
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          `A product with ID "${productId}" already exists.`,
      });
    }

    /*
     * 6. Create product
     */
    const newProduct = {
      id: productId,
      name,
      price,
      description,
      image: `assets/${cleanImageName}`,
      effect: `effects/${cleanEffectName}`,
    };

    existingProducts.push(newProduct);

    /*
     * 7. Update products.json
     */
    const updatedProducts =
      JSON.stringify(
        existingProducts,
        null,
        2
      );

    await githubRequest(
      `${githubBase}/contents/data/products.json`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Add product: ${name}`,
          content:
            Buffer.from(
              updatedProducts
            ).toString("base64"),
          sha: productsFile.sha,
          branch: "main",
        }),
      }
    );

    /*
     * 8. Return success
     */
    return res.status(200).json({
      success: true,
      message:
        "Product added successfully.",
      product: newProduct,
    });

  } catch (error) {
    console.error(
      "Add product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to add product.",
    });
  }
}