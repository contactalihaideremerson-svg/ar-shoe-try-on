import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};

    const response = await handleUpload({
      body,
      request: req,

      onBeforeGenerateToken: async (pathname) => {
        const filename = pathname.split("/").pop();

        if (!filename.toLowerCase().endsWith(".deepar")) {
          throw new Error(
            "Only .deepar files are allowed."
          );
        }

        return {
          allowedContentTypes: [
            "application/octet-stream",
          ],
          maximumSizeInBytes:
            90 * 1024 * 1024,
        };
      },

      onUploadCompleted: async ({
        blob,
      }) => {
        console.log(
          "DeepAR Blob upload completed:",
          blob.url
        );
      },
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error(
      "Blob upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Blob upload failed.",
    });
  }
}