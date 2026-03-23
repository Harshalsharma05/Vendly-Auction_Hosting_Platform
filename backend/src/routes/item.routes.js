import express from "express";
import {
  addAuctionItem,
  getAuctionItems,
  updateAuctionItem,
  updateAuctionItemStatus,
  deleteAuctionItem,
} from "../controllers/auctionItem.controller.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes nested by Auction ID
router.post(
  "/auction/:auctionId",
  protect,
  authorize("client"),
  addAuctionItem,
);
router.get("/auction/:auctionId", getAuctionItems); // Public route so participants can see the items

// Routes for specific Items
router.patch(
  "/:id/status",
  protect,
  authorize("client"),
  updateAuctionItemStatus,
);
router.patch("/:id", protect, authorize("client"), updateAuctionItem);
router.delete("/:id", protect, authorize("client"), deleteAuctionItem);

export default router;
