import express from "express"
import { upload } from "../middleware/multer.js"

const router = express.Router()

const BASE_URL = process.env.BACKEND_URL

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
  (req, res) => {
    try {
      const files = req.files

      let photoUrl = null
      let documentUrl = null
      let videoUrl = null

      if (files.photo) {
        photoUrl = `${BASE_URL}/public/temp/${files.photo[0].filename}`
      }

      if (files.document) {
        documentUrl = `${BASE_URL}/public/temp/${files.document[0].filename}`
      }

      if (files.video) {
        videoUrl = `${BASE_URL}/public/temp/${files.video[0].filename}`
      }

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