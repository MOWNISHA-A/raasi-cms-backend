import express from 'express';
import { getPublicAvailableProducts, getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../controllers/inventoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicAvailableProducts);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.route('/').get(protect, getInventoryItems).post(protect, admin, createInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update stock quantity
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.route('/:id').put(protect, admin, updateInventoryItem).delete(protect, admin, deleteInventoryItem);

export default router;
