const express = require("express");
const controller = require("../controllers/wishlistControllers");

const router = express.Router();

router.get("/", controller.getWishlist);
router.post("/", controller.createWishlistItem);
router.put("/:id", controller.updateWishlistItem);
router.delete("/:id", controller.deleteWishlistItem);

module.exports = router;
