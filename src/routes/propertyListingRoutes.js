import express from "express";
import * as listingController from "../controller/propertyListingController.js";
import verifyToken from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Property Listings
 *   description: Home / Plot / Venture / Villa listing forms
 *
 * components:
 *   schemas:
 *     PropertyListingInput:
 *       type: object
 *       required: [listing_type, contact_name, mobile, contact_type, details]
 *       properties:
 *         listing_type:
 *           type: string
 *           enum: [home, plot, venture, villa]
 *         state_id: { type: integer }
 *         district_id: { type: integer }
 *         town_id: { type: integer }
 *         town_area: { type: string, description: "Free-text town / area (defaults to the town's name)" }
 *         details:
 *           type: object
 *           description: >
 *             Type-specific fields 02-13. Unknown keys are dropped.
 *             home: property_type*, property_type_other, property_status, property_age_years, built_up_area_sqft,
 *             plot_area_sq_yards, plot_area_not_applicable, total_floors, property_floor, bedrooms, bathrooms,
 *             facing, furnishing, asking_price, negotiable, parking, utilities[].
 *             plot: venture_name, plot_number, plot_type*, plot_size_sq_yards, length_ft, width_ft, facing,
 *             price_per_sq_yard, total_price, total_price_auto, approval_type, road_width_ft, road_type, amenities[].
 *             venture: venture_name*, venture_type*, area_acres, area_guntas, total_plots, available_plots,
 *             plot_size_min_sq_yards, plot_size_max_sq_yards, available_facings[], price_per_sq_yard,
 *             approval_type, rera_status, rera_number, road_width_ft, road_type, amenities[].
 *             villa: project_name, villa_type*, construction_status, plot_area_sq_yards, built_up_area_sqft,
 *             bedrooms, bathrooms, floors, facing, asking_price, negotiable, approval_type, rera_number,
 *             road_width_ft, parking, amenities[].
 *         latitude: { type: number }
 *         longitude: { type: number }
 *         maps_link: { type: string, description: "Coordinates are parsed from it when latitude/longitude are omitted" }
 *         media:
 *           type: array
 *           description: Replace-all. kind is photo|video|floor_plan (home, villa) or photo|video|layout_map (plot, venture)
 *           items:
 *             type: object
 *             properties:
 *               kind: { type: string }
 *               url: { type: string }
 *               name: { type: string }
 *         contact_name: { type: string }
 *         mobile: { type: string, example: "9876543210" }
 *         whatsapp_same_as_mobile: { type: boolean, default: true }
 *         whatsapp_number: { type: string }
 *         contact_type:
 *           type: string
 *           description: "home: owner|agent|builder_developer; plot/villa: owner|agent|developer; venture: developer|owner|marketing_agent"
 *         is_direct_listing: { type: boolean, default: true }
 *         agent_code: { type: string, description: "Garuda Agent ID — required when is_direct_listing is false" }
 */

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create a property listing (starts as pending)
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyListingInput'
 *     responses:
 *       201: { description: Listing created }
 *       400: { description: Validation error }
 *   get:
 *     summary: List property listings
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [home, plot, venture, villa] } }
 *       - { in: query, name: status, schema: { type: string, enum: [pending, approved, rejected] } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200: { description: "{ data, pagination }" }
 */
router.post("/listings", verifyToken, listingController.createListing);
router.get("/listings", verifyToken, listingController.getListings);

/**
 * @swagger
 * /api/listings/counts:
 *   get:
 *     summary: Listing counts per type and status
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "{ data: { home: { total, pending, approved, rejected }, ... } }" }
 */
router.get("/listings/counts", verifyToken, listingController.getListingCounts);

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get a listing
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Listing }
 *       404: { description: Not found }
 *   put:
 *     summary: Replace a listing's fields (type cannot change; resets status to pending; media is replace-all)
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyListingInput'
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete a listing (Admin only)
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Admin access required }
 *       404: { description: Not found }
 */
router.get("/listings/:id", verifyToken, listingController.getListingById);
router.put("/listings/:id", verifyToken, listingController.updateListing);
router.delete("/listings/:id", verifyToken, requireAdmin, listingController.deleteListing);

/**
 * @swagger
 * /api/listings/{id}/status:
 *   patch:
 *     summary: Approve or reject a listing (Admin only)
 *     tags: [Property Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, approved, rejected] }
 *               remarks: { type: string, description: Required when rejecting }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Validation error }
 *       403: { description: Admin access required }
 */
router.patch("/listings/:id/status", verifyToken, requireAdmin, listingController.updateListingStatus);

export default router;
