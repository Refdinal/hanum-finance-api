const model = require("../models/wishlistModels");

const errorResponse = (res, error) => res.status(400).json({ status: "error", message: error.message });

const getWishlist = async (req, res) => {
  try {
    const wishlist = await model.getWishlist();
    return res.status(200).json({ status: "success", wishlist });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const createWishlistItem = async (req, res) => {
  try {
    const item = await model.createWishlistItem(req.body);
    return res.status(201).json({ status: "success", item });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const deleteWishlistItem = async (req, res) => {
  try {
    const result = await model.deleteWishlistItem(req.params.id);
    return res.status(200).json({ status: "success", result });
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = { getWishlist, createWishlistItem, deleteWishlistItem };
