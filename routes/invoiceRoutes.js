import express from 'express';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceById } from '../controllers/invoiceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.route('/').get(protect, admin, getInvoices).post(protect, admin, createInvoice);

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update payment mode of invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.route('/:id').get(protect, getInvoiceById).put(protect, admin, updateInvoice).delete(protect, admin, deleteInvoice);

export default router;
