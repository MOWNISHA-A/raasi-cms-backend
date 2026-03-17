import express from 'express';
import { getTechnicians, getTechnicianPerformance, updateTechnicianStatus, createTechnician, updateTechnician, deleteTechnician } from '../controllers/technicianController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getTechnicians)
  .post(protect, admin, createTechnician);

router.route('/:id')
  .put(protect, admin, updateTechnician)
  .delete(protect, admin, deleteTechnician);

router.get('/performance', protect, admin, getTechnicianPerformance);
router.put('/:id/status', protect, admin, updateTechnicianStatus);

export default router;
