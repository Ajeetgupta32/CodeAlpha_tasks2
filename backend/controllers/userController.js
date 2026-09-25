import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { query } from "../config/db.js";


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {

            const token = createToken(user._id)
            res.json({ success: true, token })

        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        
        const {email,password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password,process.env.JWT_SECRET);
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}
// Wishlist controllers
const toggleWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId) {
            return res.json({ success: false, message: "Missing userId or productId" });
        }
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        let wishlist = Array.isArray(user.wishlist) ? [...user.wishlist] : [];
        const pIdStr = productId.toString();
        let action = 'added';
        if (wishlist.includes(pIdStr)) {
            wishlist = wishlist.filter(id => id !== pIdStr);
            action = 'removed';
        } else {
            wishlist.push(pIdStr);
        }

        await userModel.findByIdAndUpdate(userId, { wishlist });
        res.json({ success: true, wishlist, action, message: action === 'added' ? 'Added to wishlist' : 'Removed from wishlist' });
    } catch (error) {
        console.error("Wishlist error:", error);
        res.json({ success: false, message: error.message });
    }
};

const getWishlist = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, wishlist: user.wishlist || [] });
    } catch (error) {
        console.error("Get wishlist error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Recently Viewed controllers
const addRecentlyViewed = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId) return res.json({ success: false });

        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false });

        let recentlyViewed = Array.isArray(user.recentlyViewed) ? [...user.recentlyViewed] : [];
        const pIdStr = productId.toString();
        recentlyViewed = recentlyViewed.filter(id => id !== pIdStr);
        recentlyViewed.unshift(pIdStr);
        recentlyViewed = recentlyViewed.slice(0, 10);

        await userModel.findByIdAndUpdate(userId, { recentlyViewed });
        res.json({ success: true, recentlyViewed });
    } catch (error) {
        console.error("Add recent error:", error);
        res.json({ success: false, message: error.message });
    }
};

const getRecentlyViewed = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, recentlyViewed: user.recentlyViewed || [] });
    } catch (error) {
        console.error("Get recent error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Profile management
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        res.json({
            success: true,
            profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                rewardPoints: user.rewardPoints || 100,
                role: user.role || 'customer',
                addresses: user.addresses || []
            }
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, phone } = req.body;
        const updates = {};
        if (name) updates.name = name.trim();
        if (phone !== undefined) updates.phone = phone.trim();

        const updated = await userModel.findByIdAndUpdate(userId, updates);
        res.json({ success: true, message: "Profile updated successfully", profile: updated });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const addUserAddress = async (req, res) => {
    try {
        const { userId, address } = req.body;
        if (!address || !address.street || !address.city) {
            return res.json({ success: false, message: "Incomplete address details" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        const addresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
        const newAddress = {
            id: 'addr_' + Date.now(),
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            email: address.email || user.email,
            street: address.street,
            city: address.city,
            state: address.state || '',
            zipcode: address.zipcode || '',
            country: address.country || 'India',
            phone: address.phone || '',
            isDefault: addresses.length === 0 || Boolean(address.isDefault)
        };

        if (newAddress.isDefault) {
            addresses.forEach(a => a.isDefault = false);
        }
        addresses.push(newAddress);

        await userModel.findByIdAndUpdate(userId, { addresses });
        res.json({ success: true, message: "Address added to address book", addresses });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteUserAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        const addresses = (user.addresses || []).filter(a => a.id !== addressId);
        await userModel.findByIdAndUpdate(userId, { addresses });
        res.json({ success: true, message: "Address removed", addresses });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// User Notifications
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: 'User ID is required' });
        }

        let notifRes = await query(
            `SELECT * FROM notifications WHERE "userId" = $1 ORDER BY id DESC LIMIT 20`,
            [userId.toString()]
        );

        if (notifRes.rows.length === 0) {
            await query(
                `INSERT INTO notifications ("userId", title, message, type, "isRead") VALUES
                 ($1, 'Welcome to NEXUS!', 'Use coupon code WELCOME10 for 10% off your first purchase. Happy shopping!', 'promotion', false),
                 ($1, 'Flash Sale Live 🔥', 'Mega discounts are active across Men, Women & Kids collections. Claim yours before stock runs out!', 'deal', false)`,
                [userId.toString()]
            );
            notifRes = await query(
                `SELECT * FROM notifications WHERE "userId" = $1 ORDER BY id DESC LIMIT 20`,
                [userId.toString()]
            );
        }

        const unreadCount = notifRes.rows.filter(n => !n.isRead).length;

        res.json({
            success: true,
            notifications: notifRes.rows,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.json({ success: false, message: error.message });
    }
};

const markNotificationsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        await query(
            `UPDATE notifications SET "isRead" = true WHERE "userId" = $1`,
            [userId.toString()]
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export {
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
};