import express from 'express';
import { getCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer, getCustomerHistory } from '../controllers/customerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.route('/').get(protect, getCustomers).post(protect, createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/history', protect, getCustomerHistory);
router.route('/:id').get(protect, getCustomerById).put(protect, admin, updateCustomer).delete(protect, admin, deleteCustomer);

export default router;
