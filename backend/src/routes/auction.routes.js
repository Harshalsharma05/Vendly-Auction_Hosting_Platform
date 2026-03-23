import express from "express";
import {
  createAuction,
  getAuctions,
  getMyAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
} from "../controllers/auction.controller.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/", getAuctions);

// Protected Client Routes
router.post("/", protect, authorize("client"), createAuction);
router.get("/client/my-auctions", protect, authorize("client"), getMyAuctions);
router.patch("/:id", protect, authorize("client"), updateAuction);
router.delete("/:id", protect, authorize("client"), deleteAuction);

// Public dynamic route should be placed after static/protected routes
router.get("/:id", getAuctionById);

export default router;
