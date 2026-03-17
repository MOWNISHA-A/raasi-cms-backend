import express from 'express';
import {
	getStats,
	getRevenueAnalytics,
	getServicesStatus,
	getProfitAnalytics,
	//getProfitGrowth,
	getTopSellingProducts,
	getSalesByDateRange,
	//getTopUsedSpareParts,
	getHistoryReport,
	getRecentActivities,
	getTechnicianRanking,
	getDemandPrediction,
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getStats);
router.get('/revenue', protect, admin, getRevenueAnalytics);
router.get('/services-status', protect, admin, getServicesStatus);
router.get('/profit-analytics', protect, admin, getProfitAnalytics);
//router.get('/profit-growth', protect, admin, getProfitGrowth);
router.get('/top-products', protect, admin, getTopSellingProducts);
//router.get('/top-spare-parts', protect, admin, getTopUsedSpareParts);
router.get('/history-report', protect, admin, getHistoryReport);
router.get('/recent-activities', protect, admin, getRecentActivities);
router.get('/technician-ranking', protect, admin, getTechnicianRanking);
router.get('/demand-prediction', protect, admin, getDemandPrediction);
router.get('/sales-by-date', protect, admin, getSalesByDateRange);

export default router;
