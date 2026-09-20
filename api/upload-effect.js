import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { filename, contentType } = req.body || {};

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }

    if (!filename.toLowerCase().endsWith(".deepar")) {
      return res.status(400).json({
        success: false,
        message: "Only .deepar files are allowed.",
      });
    }

    const token = await handleUpload({
      body: {
        type: "blob.generate-client-token",
        payload: JSON.stringify({
          pathname: `effects/${filename}`,
          callbackUrl: `${getBaseUrl(req)}/api/upload-effect`,
        }),
      },
      request: req,
    });

    return res.status(200).json({
      success: true,
      uploadUrl: token,
    });

  } catch (error) {
    console.error("Blob upload token error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not create Blob upload token.",
    });
  }
}

function getBaseUrl(req) {
  const protocol =
    req.headers["x-forwarded-proto"] || "https";

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host;

  return `${protocol}://${host}`;
}