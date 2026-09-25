import express from 'express';
import { addToCart, getUserCart, updateCart, saveForLater, moveToCart, removeSavedForLater } from '../controllers/cartController.js';
import authUser from '../middleware/auth.js';

const cartRouter = express.Router();

cartRouter.post('/get', authUser, getUserCart);
cartRouter.post('/add', authUser, addToCart);
cartRouter.post('/update', authUser, updateCart);
cartRouter.post('/save-for-later', authUser, saveForLater);
cartRouter.post('/move-to-cart', authUser, moveToCart);
cartRouter.post('/remove-saved', authUser, removeSavedForLater);

export default cartRouter;