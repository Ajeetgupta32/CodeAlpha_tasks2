import express from 'express';
import {
  loginUser,
  registerUser,
  adminLogin,
  toggleWishlist,
  getWishlist,
  addRecentlyViewed,
  getRecentlyViewed,
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  deleteUserAddress,
  getUserNotifications,
  markNotificationsRead
} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);

// Wishlist routes
userRouter.post('/wishlist/toggle', authUser, toggleWishlist);
userRouter.post('/wishlist/get', authUser, getWishlist);

// Recently Viewed routes
userRouter.post('/recent/add', authUser, addRecentlyViewed);
userRouter.post('/recent/get', authUser, getRecentlyViewed);

// Profile & Address Book routes
userRouter.post('/profile', authUser, getUserProfile);
userRouter.post('/profile/update', authUser, updateUserProfile);
userRouter.post('/address/add', authUser, addUserAddress);
userRouter.post('/address/delete', authUser, deleteUserAddress);

// In-app Notifications
userRouter.post('/notifications/get', authUser, getUserNotifications);
userRouter.post('/notifications/read', authUser, markNotificationsRead);

export default userRouter;