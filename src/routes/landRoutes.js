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
 *               nearest_town_1:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_1_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_2:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_2_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_3:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_3_km:
 *                 type: int
 *                 example: 14
 *
 *               land_sale_available_status:
 *                 type: object
 *                 example:
 *                   - "TOKEN RECEIVED"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "AGREEMENT Made"
 *                   - "NOT AVAILABLE"
 *                   - "SOLD"
 * 
 *               mortage_availability_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "CURRENTLY MORTGAGED"
 *                   - "NOT AVAILABLE"
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
 *               trees:
 *                 type: array
 *                 description: >
 *                   Trees present on the land. Each entry is a separate row
 *                   in the land_tree table.
 *                 items:
 *                   type: object
 *                   required: [type, count]
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "Mango"
 *                       description: >
 *                         Tree species name (e.g. Mango, Coconut, Neem, Baniyan,
 *                         Tamarind, Sapoto, Guava, Teak, or any custom name)
 *                     count:
 *                       type: integer
 *                       example: 10
 *                 example:
 *                   - { type: "Mango", count: 10 }
 *                   - { type: "Coconut", count: 5 }
 *               shed:
 *                 type: array
 *                 description: >
 *                   List of shed dimension records. Each item creates one row in land_shed_Dimensions.
 *                   You can send multiple sheds — e.g. 2 poultry sheds with different sizes,
 *                   or a mix of poultry and cow sheds.
 *                   Only fill in the fields that apply to each shed row; unused fields can be omitted (null).
 *                 items:
 *                   type: object
 *                   properties:
 *                     poultry_shed_length:
 *                       type: integer
 *                       example: 100
 *                     poultry_shed_width:
 *                       type: integer
 *                       example: 40
 *                     cow_shed_length:
 *                       type: integer
 *                       example: null
 *                     cow_shed_width:
 *                       type: integer
 *                       example: null
 *                 example:
 *                   - { poultry_shed_length: 100, poultry_shed_width: 40, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: 80,  poultry_shed_width: 35, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: null, poultry_shed_width: null, cow_shed_length: 60, cow_shed_width: 25 }
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
 *                         [card, farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
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

/**
 * @swagger
 * /api/trainee/land:
 *   get:
 *     summary: Get all trainee lands
 *     tags: [Land]
 *     responses:
 *       200:
 *         description: List of lands
 *       500:
 *         description: Server Error
 */
router.get("/trainee/land", landController.getAllTraineeLands);

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
 *               nearest_town_1:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_1_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_2:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_2_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_3:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_3_km:
 *                 type: int
 *                 example: 14
 *
 *               land_sale_available_status:
 *                 type: object
 *                 example:
 *                   - "TOKEN RECEIVED"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "AGREEMENT Made"
 *                   - "NOT AVAILABLE"
 *                   - "SOLD"
 * 
 *               mortage_availability_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "CURRENTLY MORTGAGED"
 *                   - "NOT AVAILABLE"
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
 *               call_verification_status:
 *                 type: string
 *                 enum: [pending, complete, rejected]
 * 
 *               form_status:
 *                 type: string
 *                 enum: [draft, complete, review]
 * 
 *               physcial_verification_status:
 *                 type: string
 *                 enum: [pending, complete]
 * 
 *               verification_status:
 *                 type: string
 *                 enum: [pending, complete]
 * 
 *               availablity:
 *                 type: string
 *                 enum: [sold, available]
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
 * 
 *               trees:
 *                 type: array
 *                 description: >
 *                   Trees present on the land. Each entry is a separate row
 *                   in the land_tree table.
 *                 items:
 *                   type: object
 *                   required: [type, count]
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "Mango"
 *                       description: >
 *                         Tree species name (e.g. Mango, Coconut, Neem, Baniyan,
 *                         Tamarind, Sapoto, Guava, Teak, or any custom name)
 *                     count:
 *                       type: integer
 *                       example: 10
 *                 example:
 *                   - { type: "Mango", count: 10 }
 *                   - { type: "Coconut", count: 5 }
 *               shed:
 *                 type: array
 *                 description: >
 *                   List of shed dimension records. Each item creates one row in land_shed_Dimensions.
 *                   You can send multiple sheds — e.g. 2 poultry sheds with different sizes,
 *                   or a mix of poultry and cow sheds.
 *                   Only fill in the fields that apply to each shed row; unused fields can be omitted (null).
 *                 items:
 *                   type: object
 *                   properties:
 *                     poultry_shed_length:
 *                       type: integer
 *                       example: 100
 *                     poultry_shed_width:
 *                       type: integer
 *                       example: 40
 *                     cow_shed_length:
 *                       type: integer
 *                       example: null
 *                     cow_shed_width:
 *                       type: integer
 *                       example: null
 *                 example:
 *                   - { poultry_shed_length: 100, poultry_shed_width: 40, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: 80,  poultry_shed_width: 35, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: null, poultry_shed_width: null, cow_shed_length: 60, cow_shed_width: 25 }
 * 
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
 *                         [card, farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, farmer_aggrement, others, video]
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
 *               nearest_town_1:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_1_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_2:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_2_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_3:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_3_km:
 *                 type: int
 *                 example: 14
 *
 *               land_sale_available_status:
 *                 type: object
 *                 example:
 *                   - "TOKEN RECEIVED"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "AGREEMENT Made"
 *                   - "NOT AVAILABLE"
 *                   - "SOLD"
 * 
 *               mortage_availability_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "CURRENTLY MORTGAGED"
 *                   - "NOT AVAILABLE"
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
 * 
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
 * 
 *               trees:
 *                 type: array
 *                 description: >
 *                   Trees present on the land. Each entry is a separate row
 *                   in the land_tree table.
 *                 items:
 *                   type: object
 *                   required: [type, count]
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "Mango"
 *                       description: >
 *                         Tree species name (e.g. Mango, Coconut, Neem, Baniyan,
 *                         Tamarind, Sapoto, Guava, Teak, or any custom name)
 *                     count:
 *                       type: integer
 *                       example: 10
 *                 example:
 *                   - { type: "Mango", count: 10 }
 *                   - { type: "Coconut", count: 5 }
 *               shed:
 *                 type: array
 *                 description: >
 *                   List of shed dimension records. Each item creates one row in land_shed_Dimensions.
 *                   You can send multiple sheds — e.g. 2 poultry sheds with different sizes,
 *                   or a mix of poultry and cow sheds.
 *                   Only fill in the fields that apply to each shed row; unused fields can be omitted (null).
 *                 items:
 *                   type: object
 *                   properties:
 *                     poultry_shed_length:
 *                       type: integer
 *                       example: 100
 *                     poultry_shed_width:
 *                       type: integer
 *                       example: 40
 *                     cow_shed_length:
 *                       type: integer
 *                       example: null
 *                     cow_shed_width:
 *                       type: integer
 *                       example: null
 *                 example:
 *                   - { poultry_shed_length: 100, poultry_shed_width: 40, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: 80,  poultry_shed_width: 35, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: null, poultry_shed_width: null, cow_shed_length: 60, cow_shed_width: 25 }
 * 
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
 *                         [card, farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
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

/**
 * @swagger
 * /api/land/call/verify/{id}:
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
 *               nearest_town_1:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_1_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_2:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_2_km:
 *                 type: int
 *                 example: 14
 * 
 *               nearest_town_3:
 *                 type: string
 *                 example: "jankpuri"
 * 
 *               nearest_town_3_km:
 *                 type: int
 *                 example: 14
 *
 *               land_sale_available_status:
 *                 type: object
 *                 example:
 *                   - "TOKEN RECEIVED"
 *                   - "MORTGAGED"
 *                   - "AVAILABLE FOR SALE"
 *                   - "AGREEMENT Made"
 *                   - "NOT AVAILABLE"
 *                   - "SOLD"
 * 
 *               mortage_availability_status:
 *                 type: object
 *                 example:
 *                   - "AVAILABLE FOR MORTGAGE"
 *                   - "CURRENTLY MORTGAGED"
 *                   - "NOT AVAILABLE"
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
 *               call_verification_status:
 *                 type: string
 *                 enum: [pending, complete, rejected]
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
 * 
 *               trees:
 *                 type: array
 *                 description: >
 *                   Trees present on the land. Each entry is a separate row
 *                   in the land_tree table.
 *                 items:
 *                   type: object
 *                   required: [type, count]
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "Mango"
 *                       description: >
 *                         Tree species name (e.g. Mango, Coconut, Neem, Baniyan,
 *                         Tamarind, Sapoto, Guava, Teak, or any custom name)
 *                     count:
 *                       type: integer
 *                       example: 10
 *                 example:
 *                   - { type: "Mango", count: 10 }
 *                   - { type: "Coconut", count: 5 }
 *               shed:
 *                 type: array
 *                 description: >
 *                   List of shed dimension records. Each item creates one row in land_shed_Dimensions.
 *                   You can send multiple sheds — e.g. 2 poultry sheds with different sizes,
 *                   or a mix of poultry and cow sheds.
 *                   Only fill in the fields that apply to each shed row; unused fields can be omitted (null).
 *                 items:
 *                   type: object
 *                   properties:
 *                     poultry_shed_length:
 *                       type: integer
 *                       example: 100
 *                     poultry_shed_width:
 *                       type: integer
 *                       example: 40
 *                     cow_shed_length:
 *                       type: integer
 *                       example: null
 *                     cow_shed_width:
 *                       type: integer
 *                       example: null
 *                 example:
 *                   - { poultry_shed_length: 100, poultry_shed_width: 40, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: 80,  poultry_shed_width: 35, cow_shed_length: null, cow_shed_width: null }
 *                   - { poultry_shed_length: null, poultry_shed_width: null, cow_shed_length: 60, cow_shed_width: 25 }
 * 
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
 *                         [card, farmer_photo, land_soil, fencing, farm_pond, residence, shed, water_source, trees, rocks, electric_poles, others, video]
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
router.put("/land/call/verify/:id", verifyToken, landController.updateLandForCallVerify);

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

/**
 * @swagger
 * /api/land/pending-call-verification/{status}:
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
 *           enum: [pending, complete, rejected]
 *     responses:
 *       200:
 *         description: Lands fetched by status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No lands found
 */
router.get("/land/pending-call-verification/:status", verifyToken, landController.getPendingCallVerificationLands);

/**
 * @swagger
 * /api/land/pending-physical-verification/{status}:
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
 *           enum: [pending, complete]
 *     responses:
 *       200:
 *         description: Lands fetched by status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No lands found
 */
router.get("/land/pending-physical-verification/:status", verifyToken, landController.getPendingCallVerificationLands);

/**
 * @swagger
 * /api/land/pending-final-verification/{status}:
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
 *           enum: [pending, complete]
 *     responses:
 *       200:
 *         description: Lands fetched by status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No lands found
 */
router.get("/land/pending-final-verification/:status", verifyToken, landController.getPendingFinalVerificationLands);

export default router;