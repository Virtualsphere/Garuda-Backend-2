import * as listingService from "../service/propertyListingService.js";

const handleError = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : error.message,
    ...(status === 500 && { error: error.message }),
  });
};

export const createListing = async (req, res) => {
  try {
    const listing = await listingService.createListing(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: "Listing created successfully", data: listing });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getListings = async (req, res) => {
  try {
    const result = await listingService.getListings(req.query);
    return res.status(200).json({ success: true, message: "Listings fetched successfully", ...result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getListingCounts = async (req, res) => {
  try {
    const counts = await listingService.getListingCounts();
    return res.status(200).json({ success: true, data: counts });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getListingById = async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateListing = async (req, res) => {
  try {
    const listing = await listingService.updateListing(req.params.id, req.body || {}, req.user?.id);
    return res.status(200).json({ success: true, message: "Listing updated successfully", data: listing });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateListingStatus = async (req, res) => {
  try {
    const listing = await listingService.updateListingStatus(req.params.id, req.body || {}, req.user?.id);
    return res.status(200).json({ success: true, message: `Listing ${listing.status}`, data: listing });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteListing = async (req, res) => {
  try {
    await listingService.deleteListing(req.params.id);
    return res.status(200).json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    return handleError(res, error);
  }
};
