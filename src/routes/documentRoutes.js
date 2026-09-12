import express from "express"
import { upload } from "../middleware/multer.js"
import { isGcsEnabled, uploadMulterFile } from "../utils/gcs.js"

const router = express.Router()

const BASE_URL = process.env.BACKEND_URL

async function urlFor(file) {
  if (!file) return null
  if (isGcsEnabled()) {
    return uploadMulterFile(file)
  }
  return `${BASE_URL}/public/temp/${file.filename}`
}

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management and file upload
 */

/**
 * @swagger
 * /api/upload-files:
 *   post:
 *     summary: Upload photo, document, or video
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               document:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post(
  "/upload-files",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {}

      const [photoUrl, documentUrl, videoUrl] = await Promise.all([
        urlFor(files.photo?.[0]),
        urlFor(files.document?.[0]),
        urlFor(files.video?.[0]),
      ])

      return res.status(200).json({
        message: "Files uploaded successfully",
        photoUrl,
        documentUrl,
        videoUrl,
      })
    } catch (error) {
      return res.status(500).json({
        message: "Error uploading files",
        error: error.message,
      })
    }
  }
)

export default router