import express from 'express';
import {
  joinAuction,
  getAuctionParticipants,
} from '../controllers/auctionParticipant.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/auction/:auctionId/join', protect, joinAuction);
router.get('/auction/:auctionId', getAuctionParticipants);

export default router;