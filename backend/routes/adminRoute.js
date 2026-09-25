import express from 'express';
import {
  getDashboardStats,
  getCoupons,
  getActiveCoupons,
  addCoupon,
  deleteCoupon,
  toggleCoupon,
  updateProductStock,
  getAllUsers
} from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Executive Analytics
adminRouter.get('/stats', adminAuth, getDashboardStats);

// Customer Accounts
adminRouter.get('/users', adminAuth, getAllUsers);

// Coupons
adminRouter.get('/coupons', adminAuth, getCoupons);
adminRouter.get('/coupons/active', getActiveCoupons); // Public for shoppers
adminRouter.post('/coupon/add', adminAuth, addCoupon);
adminRouter.post('/coupon/delete', adminAuth, deleteCoupon);
adminRouter.post('/coupon/toggle', adminAuth, toggleCoupon);

// Inventory
adminRouter.post('/inventory/update', adminAuth, updateProductStock);

export default adminRouter;
