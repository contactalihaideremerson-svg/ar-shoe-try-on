async function getGithubProducts() {
  const url =
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` +
    `/contents/public/data/products.json`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  const file = await response.json();

  if (!file.content) {
    throw new Error("products.json content not found.");
  }

  const cleanContent = file.content.replace(/\s/g, "");
  const decoded = Buffer.from(cleanContent, "base64").toString("utf8");

  const products = JSON.parse(decoded);

  if (!Array.isArray(products)) {
    throw new Error("products.json must contain an array.");
  }

  return products;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const products = await getGithubProducts();

    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json(products);
  } catch (error) {
    console.error("PRODUCTS API ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load products."
    });
  }
}