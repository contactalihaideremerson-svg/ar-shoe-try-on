import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  // Only POST requests are allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Vercel may provide req.body as an object or string
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    // Validate Blob client request
    if (!body || !body.type) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blob upload request.",
      });
    }

    const response = await handleUpload({
      body,
      request: req,

      // Generate the upload token
      onBeforeGenerateToken: async (
        pathname,
        clientPayload,
        multipart
      ) => {
        const filename = pathname.split("/").pop() || "";

        // Only allow DeepAR files
        if (!filename.toLowerCase().endsWith(".deepar")) {
          throw new Error(
            "Only .deepar files are allowed."
          );
        }

        return {
          // Only allow binary DeepAR files
          allowedContentTypes: [
            "application/octet-stream",
          ],

          // Maximum DeepAR file size: 90 MB
          maximumSizeInBytes:
            90 * 1024 * 1024,

          // Store some information with the token
          tokenPayload: JSON.stringify({
            filename,
            clientPayload,
            multipart: Boolean(multipart),
          }),
        };
      },

      // Called after the upload is completed
      onUploadCompleted: async ({ blob }) => {
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
        error?.message ||
        "Blob upload failed.",
    });
  }
}
