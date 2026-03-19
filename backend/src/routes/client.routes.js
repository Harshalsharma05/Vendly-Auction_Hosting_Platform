import express from 'express';
import {
  upsertProfile,
  getMyProfile,
  getPendingClients,
  updateClientStatus,
} from '../controllers/client.controller.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Client specific routes
router.post('/profile', protect, authorize('client'), upsertProfile);
router.get('/profile', protect, authorize('client'), getMyProfile);

// Admin specific routes
router.get('/admin/pending', protect, authorize('admin'), getPendingClients);
router.patch('/admin/:id/status', protect, authorize('admin'), updateClientStatus);

export default router;