import userModel from "../models/userModel.js";
import { query } from "../config/db.js";

// add products to user cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        // Stock boundary check
        const prodRes = await query('SELECT stock, "inStock" FROM products WHERE id::text = $1 LIMIT 1', [itemId.toString()]);
        const product = prodRes.rows[0];
        const currentQtyInCart = (cartData[itemId] && cartData[itemId][size]) || 0;

        if (product && product.stock !== undefined && product.stock !== null) {
            if (product.inStock === false || product.stock <= 0) {
                return res.json({ success: false, message: 'This item is currently out of stock' });
            }
            if (currentQtyInCart + 1 > product.stock) {
                return res.json({ success: false, message: `Only ${product.stock} units available in stock` });
            }
        }

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// update user cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, size, quantity } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        // Stock check when increasing quantity
        if (quantity > 0) {
            const prodRes = await query('SELECT stock, "inStock" FROM products WHERE id::text = $1 LIMIT 1', [itemId.toString()]);
            const product = prodRes.rows[0];
            if (product && product.stock !== undefined && product.stock !== null) {
                if (product.inStock === false || product.stock <= 0) {
                    return res.json({ success: false, message: 'This item is currently out of stock' });
                }
                if (quantity > product.stock) {
                    return res.json({ success: false, message: `Only ${product.stock} units available in stock` });
                }
            }
        }

        if (!cartData[itemId]) cartData[itemId] = {};
        cartData[itemId][size] = quantity;

        // Clean up empty objects
        if (quantity <= 0) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Cart Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// get user cart data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId);
        res.json({
            success: true,
            cartData: userData.cartData || {},
            savedForLater: userData.savedForLater || []
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// save item for later (moves from cartData to savedForLater)
const saveForLater = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};
        let savedForLater = Array.isArray(userData.savedForLater) ? [...userData.savedForLater] : [];

        let quantity = 1;
        if (cartData[itemId] && cartData[itemId][size]) {
            quantity = cartData[itemId][size];
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        }

        const existingIdx = savedForLater.findIndex(s => s._id.toString() === itemId.toString() && s.size === size);
        if (existingIdx >= 0) {
            savedForLater[existingIdx].quantity += quantity;
        } else {
            savedForLater.push({ _id: itemId.toString(), size, quantity });
        }

        await userModel.findByIdAndUpdate(userId, { cartData, savedForLater });
        res.json({ success: true, cartData, savedForLater, message: "Saved for later" });
    } catch (error) {
        console.log("saveForLater error:", error);
        res.json({ success: false, message: error.message });
    }
};

// move item from savedForLater back into active cartData
const moveToCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};
        let savedForLater = Array.isArray(userData.savedForLater) ? [...userData.savedForLater] : [];

        const existingIdx = savedForLater.findIndex(s => s._id.toString() === itemId.toString() && s.size === size);
        let quantity = 1;
        if (existingIdx >= 0) {
            quantity = savedForLater[existingIdx].quantity || 1;
            savedForLater.splice(existingIdx, 1);
        }

        if (!cartData[itemId]) cartData[itemId] = {};
        if (cartData[itemId][size]) {
            cartData[itemId][size] += quantity;
        } else {
            cartData[itemId][size] = quantity;
        }

        await userModel.findByIdAndUpdate(userId, { cartData, savedForLater });
        res.json({ success: true, cartData, savedForLater, message: "Moved to cart" });
    } catch (error) {
        console.log("moveToCart error:", error);
        res.json({ success: false, message: error.message });
    }
};

// remove item from savedForLater
const removeSavedForLater = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let savedForLater = Array.isArray(userData.savedForLater) ? [...userData.savedForLater] : [];

        savedForLater = savedForLater.filter(s => !(s._id.toString() === itemId.toString() && s.size === size));
        await userModel.findByIdAndUpdate(userId, { savedForLater });
        res.json({ success: true, savedForLater, message: "Removed from saved for later" });
    } catch (error) {
        console.log("removeSavedForLater error:", error);
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart, saveForLater, moveToCart, removeSavedForLater };