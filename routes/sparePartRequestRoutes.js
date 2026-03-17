import express from 'express';
import { createSparePartRequest, getSparePartRequests, updateSparePartRequestStatus } from '../controllers/sparePartRequestController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSparePartRequest)
  .get(protect, admin, getSparePartRequests);

router.put('/:id/status', protect, admin, updateSparePartRequestStatus);

export default router;
