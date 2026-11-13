import * as importService from "../service/locationImportService.js";

const isTrue = (v) => v === true || v === "true" || v === "1";

export const importLocations = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attach the Excel/CSV file in the "file" field.' });
    }
    // Dry run unless the caller explicitly commits — a stray call never writes.
    const dryRun = !isTrue(req.query.commit ?? req.body?.commit);
    const result = await importService.importLocations(req.file.buffer, req.file.originalname, { dryRun });
    return res.status(200).json({
      success: true,
      message: dryRun ? "Preview generated — nothing was saved" : "Locations imported successfully",
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: status === 500 ? "Location import failed" : error.message,
      ...(status === 500 && { error: error.message }),
    });
  }
};

export const downloadTemplate = async (req, res) => {
  try {
    const buffer = await importService.buildTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="location-import-template.xlsx"');
    return res.send(Buffer.from(buffer));
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not build the template", error: error.message });
  }
};
