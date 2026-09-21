export default async function handler(req, res) {
  // --------------------------------------------------
  // Only POST requests are allowed
  // --------------------------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // --------------------------------------------------
    // Load Vercel Blob only after we know this is POST
    // --------------------------------------------------
    const { handleUpload } = await import("@vercel/blob/client");

    // --------------------------------------------------
    // Parse request body
    // --------------------------------------------------
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    if (!body || !body.type) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blob upload request.",
      });
    }

    // --------------------------------------------------
    // Handle Vercel Blob client upload
    // --------------------------------------------------
    const response = await handleUpload({
      body,
      request: req,

      // ------------------------------------------------
      // Generate client upload token
      // ------------------------------------------------
      onBeforeGenerateToken: async (
        pathname,
        clientPayload,
        multipart
      ) => {
        const filename =
          pathname.split("/").pop() || "";

        // Only allow .deepar files
        if (
          !filename
            .toLowerCase()
            .endsWith(".deepar")
        ) {
          throw new Error(
            "Only .deepar files are allowed."
          );
        }

        return {
          allowedContentTypes: [
            "application/octet-stream",
          ],

          // 90 MB maximum
          maximumSizeInBytes:
            90 * 1024 * 1024,

          tokenPayload: JSON.stringify({
            filename,
            clientPayload,
            multipart: Boolean(multipart),
          }),
        };
      },

      // ------------------------------------------------
      // Upload completed
      // ------------------------------------------------
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
      "DeepAR Blob upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "DeepAR Blob upload failed.",
    });
  }
}