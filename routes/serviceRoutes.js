import express from 'express';
import { getServices, trackService, createService, updateService, deleteService } from '../controllers/serviceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a new service record
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 */
router.route('/').get(protect, getServices).post(protect, admin, createService);

/**
 * @swagger
 * /api/services/track/{serviceId}:
 *   get:
 *     summary: Track service status publicly
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 */
router.route('/track/:serviceId').get(trackService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update service status / add notes
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.route('/:id').put(protect, updateService).delete(protect, admin, deleteService);

export default router;
