import express from 'express';
import {
  createAuction,
  getAuctions,
  getMyAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
} from '../controllers/auction.controller.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.get('/', getAuctions);
router.get('/:id', getAuctionById); // Note: Always put dynamic routes like /:id below static ones like /my-auctions

// Protected Client Routes
router.post('/', protect, authorize('client'), createAuction);
router.get('/client/my-auctions', protect, authorize('client'), getMyAuctions);
router.patch('/:id', protect, authorize('client'), updateAuction);
router.delete('/:id', protect, authorize('client'), deleteAuction);

export default router;