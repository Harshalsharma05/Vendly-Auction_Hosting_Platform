import express from 'express';
import {
  getAuctionBids,
  getItemBids,
  getMyBids,
} from '../controllers/bid.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/auction/:auctionId', getAuctionBids);
router.get('/item/:itemId', getItemBids);
router.get('/my-bids', protect, getMyBids);

export default router;