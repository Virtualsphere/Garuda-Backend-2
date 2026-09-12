import { Storage } from "@google-cloud/storage"
import fs from "fs"

const bucketName = process.env.GCS_BUCKET || ""
const mediaBaseUrl = (
  process.env.MEDIA_BASE_URL ||
  (bucketName ? `https://storage.googleapis.com/${bucketName}` : "")
).replace(/\/$/, "")

const storage = bucketName ? new Storage() : null

export function isGcsEnabled() {
  return Boolean(bucketName && storage)
}

export function publicUrlFor(objectPath) {
  return `${mediaBaseUrl}/${objectPath}`
}

export async function uploadLocalFile({ localPath, objectPath, contentType }) {
  if (!isGcsEnabled()) {
    throw new Error("GCS is not configured (set GCS_BUCKET)")
  }

  const bucket = storage.bucket(bucketName)
  await bucket.upload(localPath, {
    destination: objectPath,
    resumable: false,
    metadata: {
      contentType: contentType || "application/octet-stream",
      cacheControl: "public, max-age=31536000",
    },
  })

  return publicUrlFor(objectPath)
}

export async function uploadMulterFile(file) {
  if (!file?.path || !fs.existsSync(file.path)) {
    return null
  }

  const objectPath = `temp/${file.filename}`
  return uploadLocalFile({
    localPath: file.path,
    objectPath,
    contentType: file.mimetype,
  })
}
