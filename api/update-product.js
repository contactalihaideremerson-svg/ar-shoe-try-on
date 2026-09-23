import { get } from "@vercel/blob";

function safeFilename(filename) {
  return filename
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function getGithubFile(path) {
  const url =
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` +
    `/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;

    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function saveGithubFile(path, contentBase64, message, sha) {
  const url =
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` +
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
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${response.status} ${text}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      id,
      enabled,
      name,
      price,
      description,
      imageBase64,
      imageName,
      effectBlobPathname,
      effectName,
    } = req.body || {};

    // Validate request
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product id is required.",
      });
    }

    const hasEnabledUpdate = typeof enabled === "boolean";
    const hasName = typeof name === "string" && name.trim() !== "";
    const hasPrice = typeof price === "string" && price.trim() !== "";
    const hasDescription =
      typeof description === "string" && description.trim() !== "";
    const hasImageUpdate =
      typeof imageBase64 === "string" &&
      imageBase64 !== "" &&
      typeof imageName === "string" &&
      imageName !== "";
    const hasEffectUpdate =
      typeof effectBlobPathname === "string" &&
      effectBlobPathname !== "" &&
      typeof effectName === "string" &&
      effectName !== "";

    if (
      !hasEnabledUpdate &&
      !hasName &&
      !hasPrice &&
      !hasDescription &&
      !hasImageUpdate &&
      !hasEffectUpdate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide at least one field to update: enabled, name, price, description, image, or DeepAR effect.",
      });
    }

    if (hasEffectUpdate && !effectName.toLowerCase().endsWith(".deepar")) {
      return res.status(400).json({
        success: false,
        message: "The selected effect must be a .deepar file.",
      });
    }

    // Check GitHub configuration
    if (
      !process.env.GITHUB_TOKEN ||
      !process.env.GITHUB_OWNER ||
      !process.env.GITHUB_REPO
    ) {
      throw new Error("GitHub environment variables are not configured.");
    }

    // IMPORTANT: products.json is inside public/data
    const productsPath = "public/data/products.json";

    // Get current products.json
    const existingFile = await getGithubFile(productsPath);

    if (!existingFile?.content) {
      return res.status(404).json({
        success: false,
        message: "products.json was not found.",
      });
    }

    // Decode GitHub Base64 content
    const decoded = Buffer.from(
  existingFile.content.replace(/\s/g, ""),
  "base64"
).toString("utf8");

    let products;

    try {
      products = JSON.parse(decoded);
    } catch (error) {
      throw new Error("products.json contains invalid JSON.");
    }

    if (!Array.isArray(products)) {
      throw new Error("products.json must contain an array.");
    }

    // Find product
    const product = products.find((item) => item.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Apply whichever fields were provided
    const changeLabels = [];

    if (hasEnabledUpdate) {
      product.enabled = enabled;
      changeLabels.push(enabled ? "enabled" : "disabled");
    }

    if (hasName) {
      product.name = name.trim();
      changeLabels.push("name updated");
    }

    if (hasPrice) {
      product.price = price.trim();
      changeLabels.push("price updated");
    }

    if (hasDescription) {
      product.description = description.trim();
      changeLabels.push("description updated");
    }

    // -----------------------------------------------------
    // Replace product image (uploaded as base64 from the
    // browser, same as add-product.js)
    // -----------------------------------------------------
    if (hasImageUpdate) {
      const imagePath = `public/assets/${Date.now()}-${safeFilename(imageName)}`;

      await saveGithubFile(
        imagePath,
        imageBase64,
        `Update product image: ${product.name}`
      );

      product.image = imagePath.replace(/^public\//, "");
      changeLabels.push("image updated");
    }

    // -----------------------------------------------------
    // Replace DeepAR effect (uploaded to a private Vercel
    // Blob first, same flow as add-product.js, then copied
    // into the repo)
    // -----------------------------------------------------
    if (hasEffectUpdate) {
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

      const effectPath = `public/effects/${safeFilename(effectName)}`;
      const existingEffect = await getGithubFile(effectPath);

      await saveGithubFile(
        effectPath,
        effectBase64,
        `Update DeepAR effect: ${product.name}`,
        existingEffect?.sha
      );

      product.effect = effectPath.replace(/^public\//, "");
      changeLabels.push("effect updated");
    }

    // Convert updated products.json to Base64
    const productsBase64 = Buffer.from(
      JSON.stringify(products, null, 2),
      "utf8"
    ).toString("base64");

    // Save back to GitHub
    await saveGithubFile(
      productsPath,
      productsBase64,
      `Update product (${changeLabels.join(", ")}): ${product.name}`,
      existingFile.sha
    );

    // Success response
    return res.status(200).json({
      success: true,
      message: `Product updated successfully.`,
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to update product.",
    });
  }
}
