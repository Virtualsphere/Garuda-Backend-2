import express from "express";
import multer from "multer";
import * as importController from "../controller/locationImportController.js";
import verifyToken from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

// Kept in memory, never written to disk: the shared multer config saves into
// public/temp, which is served publicly, and an import sheet is not media.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|csv)$/i.test(file.originalname || "");
    cb(ok ? null : Object.assign(new Error("Upload an Excel .xlsx or a .csv file."), { status: 400 }), ok);
  },
});

/** Turn multer errors (too large, wrong type) into a 400 instead of Express's HTML 500. */
const singleFile = (req, res, next) =>
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "The file is larger than 15 MB." : err.message;
    return res.status(400).json({ success: false, message });
  });

/**
 * @swagger
 * /api/location/import:
 *   post:
 *     summary: Bulk-import states, districts, mandals, villages (and towns) from an Excel/CSV sheet
 *     description: >
 *       One row per village with columns State, District, Mandal, Village and optional Town
 *       (header names are matched loosely). Names are matched to existing locations within their
 *       parent ignoring case/extra spaces, so only missing locations are created.
 *       Without commit=true this is a dry run that returns the preview and saves nothing.
 *       Requires the "location" permission.
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: commit
 *         schema: { type: boolean, default: false }
 *         description: true to write; otherwise a preview only
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: "{ data: { dryRun, totalRows, validRows, duplicateRows, skippedRows, created, existing, samples, errors } }"
 *       400:
 *         description: Unreadable file, missing columns, or too many rows
 *       403:
 *         description: Missing the location permission
 */
router.post("/location/import", verifyToken, checkPermission("location"), singleFile, importController.importLocations);

/**
 * @swagger
 * /api/location/import/template:
 *   get:
 *     summary: Download the Excel template for the location import
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: location-import-template.xlsx
 */
router.get("/location/import/template", verifyToken, importController.downloadTemplate);

export default router;
