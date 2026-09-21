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
    const { id, enabled } = req.body || {};

    // Validate request
    if (!id || typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Product id and boolean enabled value are required.",
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

    // Update ON/OFF status
    product.enabled = enabled;

    // Convert updated products.json to Base64
    const productsBase64 = Buffer.from(
      JSON.stringify(products, null, 2),
      "utf8"
    ).toString("base64");

    // Save back to GitHub
    await saveGithubFile(
      productsPath,
      productsBase64,
      `${enabled ? "Enable" : "Disable"} product: ${product.name}`,
      existingFile.sha
    );

    // Success response
    return res.status(200).json({
      success: true,
      message: `Product ${
        enabled ? "enabled" : "disabled"
      } successfully.`,
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
