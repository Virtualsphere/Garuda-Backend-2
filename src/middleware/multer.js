import multer from "multer"
import path, { dirname } from "path"
import fs from "fs"
import { fileURLToPath } from "url"

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/temp")

    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9)

    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
})

export { upload }