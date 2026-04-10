import express from "express";
import {
  approveSubmission,
  getPendingSubmissions,
  rejectSubmission,
  submitItem,
} from "../controllers/itemSubmission.controller.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:auctionId", protect, authorize("client"), getPendingSubmissions);
router.post("/:auctionId", protect, authorize("participant"), submitItem);
router.patch(
  "/:submissionId/approve",
  protect,
  authorize("client"),
  approveSubmission,
);
router.patch(
  "/:submissionId/reject",
  protect,
  authorize("client"),
  rejectSubmission,
);

export default router;
