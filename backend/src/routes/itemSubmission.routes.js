import express from "express";
import { submitItem } from "../controllers/itemSubmission.controller.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:auctionId", protect, authorize("participant"), submitItem);

export default router;
