import express from "express";
import * as landController from "../controller/landController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CREATE LAND (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/land:
 *   post:
 *     summary: Create land (JWT required)
 *     tags: [Land]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Telangana"
 *               district:
 *                 type: string
 *                 example: "Hyderabad"
 *               mandal:
 *                 type: string
 *                 example: "Shamshabad"
 *               village:
 *                 type: string
 *                 example: "Kothur"
 *
 *               location_latitude:
 *                 type: string
 *                 example: "17.2403"
 *               location_longitude:
 *                 type: string
 *                 example: "78.4294"
 *
 *               land_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "TOKEN"
 *                   - "AGREEMENT"
 *                   - "SOLD"
 *
 *               urgency_listing:
 *                 type: object
 *                 example:
 *                   - "urgent sale"
 *                   - "premium listing"
 *
 *               verification_package:
 *                 type: boolean
 *                 example: true
 * 
 *               form_status:
 *                 type: string
 *                 enum: [draft, complete, review]
 * 
 *               farmerDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Ramesh"
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *                   whatsapp:
 *                     type: string
 *                     example: "9876543210"
 *                   ownership_type:
 *                     type: string
 *                     enum: [Ancestral, Purchased]
 *                   locality:
 *                     type: string
 *                     enum: [Local, Non-local]
 *                   ownership_status:
 *                     type: string
 *                     enum: [Own, Joint]
 *                   age:
 *                     type: string
 *                     enum: [Upto 30, 30-50, 50+]
 *                   literacy:
 *                     type: string
 *                     enum: [Illiterate, Literate, High School, Graduate]
 *                   nature:
 *                     type: string
 *                     enum: [Calm, Polite, Normal, Rude]
 *
 *               landDetails:
 *                 type: object
 *                 properties:
 *                   total_acres:
 *                     type: number
 *                     example: 5
 *                   guntas:
 *                     type: number
 *                     example: 20
 *                   price_per_acres:
 *                     type: number
 *                     example: 1000000
 *                   total_value:
 *                     type: number
 *                     example: 5000000
 *                   nearest_road_type:
 *                     type: string
 *                     example: "Highway"
 *                   land_attached_to_road:
 *                     type: string
 *                     enum: [yes, no]
 *                   path_ownership:
 *                     type: string
 *                     example: "Naksha path"
 *                   land_entry_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_entry_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   land_boundary_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_boundary_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   soil_type:
 *                     type: string
 *                     example: "red"
 *                   fencing_status:
 *                     type: string
 *                     example: "all sides with gate"
 *
 *                   electricity:
 *                     type: object
 *                     example:
 *                       - "single phase"
 *                       - "three phase"
 *
 *                   residence:
 *                     type: object
 *                     example:
 *                       - "developed farm"
 *                       - "rcc house"
 *                       - "asbestos shelter"
 *                       - "hut"
 * 
 *                   poultry_shed_number:
 *                      type: number
 *                      example: 10
 * 
 *                   cow_shed_number:
 *                      type: number
 *                      example: 10
 *
 *                   water_source:
 *                     type: object
 *                     example:
 *                       - "borewell"
 *                       - "cheruvu"
 *                       - "canal"
 *                       - "not available"
 *
 *                   number_of_bores:
 *                     type: integer
 *                     example: 10
 *                   farm_pond:
 *                     type: boolean
 *                   mango_trees_number:
 *                      type: string
 *                      example: mango-10
 *                   coconut_trees_number:
 *                      type: string
 *                      example: coconut-10
 *                   neem_trees_number:
 *                      type: string
 *                      example: neem-10
 *                   baniyan_trees_number:
 *                      type: string
 *                      example: baniyan-10
 *                   tamarind_trees_number:
 *                      type: string
 *                      example: tamarind-10
 *                   sapoto_trees_number:
 *                      type: string
 *                      example: sapoto-10
 *                   guava_trees_number:
 *                      type: string
 *                      example: guava-10
 *                   teak_trees_number:
 *                      type: string
 *                      example: teak-10
 *                   other_trees_number:
 *                      type: string
 *                      example: banana-10
 *                   complaints:
 *                      type: object
 *                      example:
 *                        - "Siblings Issue (own Brother or Sister)"
 *                        - "Cousins Issue (of uncles family)"
 *                        - "Boundary"
 *                        - "Rocks In Land"
 *                        - "Electric Poles"
 *                        - "Sealing"
 *                        - "path issue"
 *                        - "No Path at all"
 *               gps:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: string
 *                     example: "17.2403"
 *                   longitude:
 *                     type: string
 *                     example: "78.4294"
 *
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum:
 *                         [farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                     url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     doc_type:
 *                       type: string
 *                       enum: [PASSBOOK, AADHAR, TITLE_DEED]
 *                     file_url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *     responses:
 *       201:
 *         description: Land created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/land", verifyToken, landController.createLand);

/* =====================================================
   FILTER LANDS
===================================================== */

/**
 * @swagger
 * /api/land/filter/all:
 *   get:
 *     summary: Filter lands
 *     tags: [Land]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: mandal
 *         schema:
 *           type: string
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered lands
 *       500:
 *         description: Server Error
 */
router.get("/land/filter/all", landController.filterLands);

/* =====================================================
   GET ALL LANDS
===================================================== */

/**
 * @swagger
 * /api/land:
 *   get:
 *     summary: Get all lands
 *     tags: [Land]
 *     responses:
 *       200:
 *         description: List of lands
 *       500:
 *         description: Server Error
 */
router.get("/land", landController.getAllLands);

/* =====================================================
   GET LAND BY ID
===================================================== */

/**
 * @swagger
 * /api/land/{id}:
 *   get:
 *     summary: Get land by ID
 *     tags: [Land]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Land details
 *       404:
 *         description: Land not found
 */
router.get("/land/:id", landController.getLandById);

/* =====================================================
   UPDATE LAND (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/land/{id}:
 *   put:
 *     summary: Update land (JWT required)
 *     tags: [Land]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Telangana"
 *               district:
 *                 type: string
 *                 example: "Hyderabad"
 *               mandal:
 *                 type: string
 *                 example: "Shamshabad"
 *               village:
 *                 type: string
 *                 example: "Kothur"
 *
 *               location_latitude:
 *                 type: string
 *                 example: "17.2403"
 *               location_longitude:
 *                 type: string
 *                 example: "78.4294"
 *
 *               land_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "TOKEN"
 *                   - "AGREEMENT"
 *                   - "SOLD"
 *
 *               urgency_listing:
 *                 type: object
 *                 example:
 *                   - "urgent sale"
 *                   - "premium listing"
 *
 *               verification_package:
 *                 type: boolean
 *                 example: true
 * 
 *               form_status:
 *                 type: string
 *                 enum: [draft, complete, review]
 * 
 *               farmerDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Ramesh"
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *                   whatsapp:
 *                     type: string
 *                     example: "9876543210"
 *                   ownership_type:
 *                     type: string
 *                     enum: [Ancestral, Purchased]
 *                   locality:
 *                     type: string
 *                     enum: [Local, Non-local]
 *                   ownership_status:
 *                     type: string
 *                     enum: [Own, Joint]
 *                   age:
 *                     type: string
 *                     enum: [Upto 30, 30-50, 50+]
 *                   literacy:
 *                     type: string
 *                     enum: [Illiterate, Literate, High School, Graduate]
 *                   nature:
 *                     type: string
 *                     enum: [Calm, Polite, Normal, Rude]
 *
 *               landDetails:
 *                 type: object
 *                 properties:
 *                   total_acres:
 *                     type: number
 *                     example: 5
 *                   guntas:
 *                     type: number
 *                     example: 20
 *                   price_per_acres:
 *                     type: number
 *                     example: 1000000
 *                   total_value:
 *                     type: number
 *                     example: 5000000
 *                   nearest_road_type:
 *                     type: string
 *                     example: "Highway"
 *                   land_attached_to_road:
 *                     type: string
 *                     enum: [yes, no]
 *                   path_ownership:
 *                     type: string
 *                     example: "Naksha path"
 *                   land_entry_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_entry_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   land_boundary_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_boundary_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   soil_type:
 *                     type: string
 *                     example: "red"
 *                   fencing_status:
 *                     type: string
 *                     example: "all sides with gate"
 *
 *                   electricity:
 *                     type: object
 *                     example:
 *                       - "single phase"
 *                       - "three phase"
 *
 *                   residence:
 *                     type: object
 *                     example:
 *                       - "developed farm"
 *                       - "rcc house"
 *                       - "asbestos shelter"
 *                       - "hut"
 * 
 *                   poultry_shed_number:
 *                      type: number
 *                      example: 10
 * 
 *                   cow_shed_number:
 *                      type: number
 *                      example: 10
 *
 *                   water_source:
 *                     type: object
 *                     example:
 *                       - "borewell"
 *                       - "cheruvu"
 *                       - "canal"
 *                       - "not available"
 *
 *                   number_of_bores:
 *                     type: integer
 *                     example: 10
 *                   farm_pond:
 *                     type: boolean
 *                   mango_trees_number:
 *                      type: string
 *                      example: mango-10
 *                   coconut_trees_number:
 *                      type: string
 *                      example: coconut-10
 *                   neem_trees_number:
 *                      type: string
 *                      example: neem-10
 *                   baniyan_trees_number:
 *                      type: string
 *                      example: baniyan-10
 *                   tamarind_trees_number:
 *                      type: string
 *                      example: tamarind-10
 *                   sapoto_trees_number:
 *                      type: string
 *                      example: sapoto-10
 *                   guava_trees_number:
 *                      type: string
 *                      example: guava-10
 *                   teak_trees_number:
 *                      type: string
 *                      example: teak-10
 *                   other_trees_number:
 *                      type: string
 *                      example: banana-10
 *                   complaints:
 *                      type: object
 *                      example:
 *                        - "Siblings Issue (own Brother or Sister)"
 *                        - "Cousins Issue (of uncles family)"
 *                        - "Boundary"
 *                        - "Rocks In Land"
 *                        - "Electric Poles"
 *                        - "Sealing"
 *                        - "path issue"
 *                        - "No Path at all"
 *               gps:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: string
 *                     example: "17.2403"
 *                   longitude:
 *                     type: string
 *                     example: "78.4294"
 *
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum:
 *                         [farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                     url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     doc_type:
 *                       type: string
 *                       enum: [PASSBOOK, AADHAR, TITLE_DEED]
 *                     file_url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *     responses:
 *       200:
 *         description: Land updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/land/:id", verifyToken, landController.updateLand);

/**
 * @swagger
 * /api/land/verify/{id}:
 *   put:
 *     summary: Update land physical verification (JWT required)
 *     tags: [Land]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Telangana"
 *               district:
 *                 type: string
 *                 example: "Hyderabad"
 *               mandal:
 *                 type: string
 *                 example: "Shamshabad"
 *               village:
 *                 type: string
 *                 example: "Kothur"
 *
 *               location_latitude:
 *                 type: string
 *                 example: "17.2403"
 *               location_longitude:
 *                 type: string
 *                 example: "78.4294"
 *
 *               land_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "TOKEN"
 *                   - "AGREEMENT"
 *                   - "SOLD"
 *
 *               urgency_listing:
 *                 type: object
 *                 example:
 *                   - "urgent sale"
 *                   - "premium listing"
 *
 *               verification_package:
 *                 type: boolean
 *                 example: true
 * 
 *               form_status:
 *                 type: string
 *                 enum: [draft, complete, review]
 * 
 *               physcial_verification_status:
 *                 type: string
 *                 enum: [pending, complete]
 * 
 *               farmerDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Ramesh"
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *                   whatsapp:
 *                     type: string
 *                     example: "9876543210"
 *                   ownership_type:
 *                     type: string
 *                     enum: [Ancestral, Purchased]
 *                   locality:
 *                     type: string
 *                     enum: [Local, Non-local]
 *                   ownership_status:
 *                     type: string
 *                     enum: [Own, Joint]
 *                   age:
 *                     type: string
 *                     enum: [Upto 30, 30-50, 50+]
 *                   literacy:
 *                     type: string
 *                     enum: [Illiterate, Literate, High School, Graduate]
 *                   nature:
 *                     type: string
 *                     enum: [Calm, Polite, Normal, Rude]
 *
 *               landDetails:
 *                 type: object
 *                 properties:
 *                   total_acres:
 *                     type: number
 *                     example: 5
 *                   guntas:
 *                     type: number
 *                     example: 20
 *                   price_per_acres:
 *                     type: number
 *                     example: 1000000
 *                   total_value:
 *                     type: number
 *                     example: 5000000
 *                   nearest_road_type:
 *                     type: string
 *                     example: "Highway"
 *                   land_attached_to_road:
 *                     type: string
 *                     enum: [yes, no]
 *                   path_ownership:
 *                     type: string
 *                     example: "Naksha path"
 *                   land_entry_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_entry_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   land_boundary_latitude:
 *                      type: string
 *                      example: "17.2403"
 *                   land_boundary_longitude:
 *                      type: string
 *                      example: "78.4294"
 *                   soil_type:
 *                     type: string
 *                     example: "red"
 *                   fencing_status:
 *                     type: string
 *                     example: "all sides with gate"
 *
 *                   electricity:
 *                     type: object
 *                     example:
 *                       - "single phase"
 *                       - "three phase"
 *
 *                   residence:
 *                     type: object
 *                     example:
 *                       - "developed farm"
 *                       - "rcc house"
 *                       - "asbestos shelter"
 *                       - "hut"
 * 
 *                   poultry_shed_number:
 *                      type: number
 *                      example: 10
 * 
 *                   cow_shed_number:
 *                      type: number
 *                      example: 10
 *
 *                   water_source:
 *                     type: object
 *                     example:
 *                       - "borewell"
 *                       - "cheruvu"
 *                       - "canal"
 *                       - "not available"
 *
 *                   number_of_bores:
 *                     type: integer
 *                     example: 10
 *                   farm_pond:
 *                     type: boolean
 *                   mango_trees_number:
 *                      type: string
 *                      example: mango-10
 *                   coconut_trees_number:
 *                      type: string
 *                      example: coconut-10
 *                   neem_trees_number:
 *                      type: string
 *                      example: neem-10
 *                   baniyan_trees_number:
 *                      type: string
 *                      example: baniyan-10
 *                   tamarind_trees_number:
 *                      type: string
 *                      example: tamarind-10
 *                   sapoto_trees_number:
 *                      type: string
 *                      example: sapoto-10
 *                   guava_trees_number:
 *                      type: string
 *                      example: guava-10
 *                   teak_trees_number:
 *                      type: string
 *                      example: teak-10
 *                   other_trees_number:
 *                      type: string
 *                      example: banana-10
 *                   complaints:
 *                      type: object
 *                      example:
 *                        - "Siblings Issue (own Brother or Sister)"
 *                        - "Cousins Issue (of uncles family)"
 *                        - "Boundary"
 *                        - "Rocks In Land"
 *                        - "Electric Poles"
 *                        - "Sealing"
 *                        - "path issue"
 *                        - "No Path at all"
 *               gps:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: string
 *                     example: "17.2403"
 *                   longitude:
 *                     type: string
 *                     example: "78.4294"
 *
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum:
 *                         [farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                     url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     doc_type:
 *                       type: string
 *                       enum: [PASSBOOK, AADHAR, TITLE_DEED]
 *                     file_url:
 *                       type: string
 *                       example: "http://72.61.169.226:5000/public/temp/1777114406616-370160143-images (3).jpeg"
 *
 *     responses:
 *       200:
 *         description: Land updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/land/verify/:id", verifyToken, landController.updateLandForVerify);

/* =====================================================
   DELETE LAND (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/land/{id}:
 *   delete:
 *     summary: Delete land (JWT required)
 *     tags: [Land]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Land deleted successfully
 *       404:
 *         description: Land not found
 */
router.delete("/land/:id", verifyToken, landController.deleteLand);

/**
 * @swagger
 * /api/land/status/{status}:
 *   get:
 *     summary: Get lands by form status (JWT required)
 *     tags: [Land]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [draft, complete, review]
 *     responses:
 *       200:
 *         description: Lands fetched by status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No lands found
 */
router.get("/land/status/:status", verifyToken, landController.getLandByStatus);

export default router;