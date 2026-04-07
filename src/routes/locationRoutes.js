import express from "express";
import * as locationController from "../controller/locationController.js";

const router = express.Router();

/* =====================================================
   CREATE
===================================================== */ 

/**
 * @swagger
 * /api/location/state:
 *   post:
 *     summary: Create a new state
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Telangana"
 *     responses:
 *       201:
 *         description: State created successfully
 *       400:
 *         description: Bad request
 */
router.post("/location/state", locationController.createState);

/**
 * @swagger
 * /api/location/district:
 *   post:
 *     summary: Create a new district
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, state_id]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hyderabad"
 *               state_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: District created successfully
 *       400:
 *         description: Bad request
 */
router.post("/location/district", locationController.createDistrict);

/**
 * @swagger
 * /api/location/mandal:
 *   post:
 *     summary: Create a new mandal
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, district_id]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gachibowli"
 *               district_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Mandal created successfully
 *       400:
 *         description: Bad request
 */
router.post("/location/mandal", locationController.createMandal);

/**
 * @swagger
 * /api/location/village:
 *   post:
 *     summary: Create a new village
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, mandal_id]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kondapur"
 *               mandal_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Village created successfully
 *       400:
 *         description: Bad request
 */
router.post("/location/village", locationController.createVillage);

/* =====================================================
   GET
===================================================== */

/**
 * @swagger
 * /api/location:
 *   get:
 *     summary: Get full location hierarchy
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Full location data
 *       500:
 *         description: Server Error
 */
router.get("/location", locationController.getAllLocations);

/**
 * @swagger
 * /api/location/state/{id}:
 *   get:
 *     summary: Get state by ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: State data
 *       404:
 *         description: Not found
 */
router.get("/location/state/:id", locationController.getStateById);

/* =====================================================
   FILTER (Dropdown APIs)
===================================================== */

/**
 * @swagger
 * /api/location/districts/{state_id}:
 *   get:
 *     summary: Get districts by state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: state_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of districts
 *       500:
 *         description: Server Error
 */
router.get("/location/districts/:state_id", locationController.getDistrictsByState);

/**
 * @swagger
 * /api/location/mandals/{district_id}:
 *   get:
 *     summary: Get mandals by district
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: district_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of mandals
 *       500:
 *         description: Server Error
 */
router.get("/location/mandals/:district_id", locationController.getMandalsByDistrict);

/**
 * @swagger
 * /api/location/villages/{mandal_id}:
 *   get:
 *     summary: Get villages by mandal
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: mandal_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of villages
 *       500:
 *         description: Server Error
 */
router.get("/location/villages/:mandal_id", locationController.getVillagesByMandal);

/* =====================================================
   UPDATE
===================================================== */

/**
 * @swagger
 * /api/location/state/{id}:
 *   put:
 *     summary: Update state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Andhra Pradesh"
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.put("/location/state/:id", locationController.updateState);

/**
 * @swagger
 * /api/location/district/{id}:
 *   put:
 *     summary: Update district
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hyderabad"
 *     responses:
 *       200:
 *         description: List of villages
*       404:
 *         description: Not found
 */
router.put("/location/district/:id", locationController.updateDistrict);

/**
 * @swagger
 * /api/location/mandal/{id}:
 *   put:
 *     summary: Update mandal
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gachibowli"
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.put("/location/mandal/:id", locationController.updateMandal);

/**
 * @swagger
 * /api/location/village/{id}:
 *   put:
 *     summary: Update village
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kondapur"
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.put("/location/village/:id", locationController.updateVillage);

/* =====================================================
   DELETE
===================================================== */

/**
 * @swagger
 * /api/location/state/{id}:
 *   delete:
 *     summary: Delete state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.delete("/location/state/:id", locationController.deleteState);

/**
 * @swagger
 * /api/location/district/{id}:
 *   delete:
 *     summary: Delete district
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.delete("/location/district/:id", locationController.deleteDistrict);

/**
 * @swagger
 * /api/location/mandal/{id}:
 *   delete:
 *     summary: Delete mandal
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.delete("/location/mandal/:id", locationController.deleteMandal);

/**
 * @swagger
 * /api/location/village/{id}:
 *   delete:
 *     summary: Delete village
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of villages
 *       404:
 *         description: Not found
 */
router.delete("/location/village/:id", locationController.deleteVillage);

export default router;