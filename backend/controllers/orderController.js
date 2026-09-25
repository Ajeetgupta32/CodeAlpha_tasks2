import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { query } from "../config/db.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'

// global variables
const currency = 'inr'
const deliveryCharge = 10

// gateway initialize safely (prevents server crash on startup if payment env vars are omitted)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const razorpayInstance = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    ? new razorpay({
        key_id : process.env.RAZORPAY_KEY_ID,
        key_secret : process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    
    try {
        
        const { userId, items, amount, address} = req.body;

        // Stock check before placing order
        for (const item of (items || [])) {
            const pId = item._id || item.id;
            if (pId) {
                const prodRes = await query('SELECT id, name, stock, "inStock" FROM products WHERE id::text = $1', [pId.toString()]);
                const prod = prodRes.rows[0];
                if (prod) {
                    if (prod.inStock === false || (prod.stock !== null && prod.stock < item.quantity)) {
                        return res.json({
                            success: false,
                            message: `Sorry, "${prod.name}" has only ${prod.stock || 0} units left in stock.`
                        });
                    }
                }
            }
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        // Decrement stock for purchased items
        for (const item of (items || [])) {
            const pId = item._id || item.id;
            if (pId) {
                await query(
                    `UPDATE products SET stock = GREATEST(0, stock - $1), "inStock" = (CASE WHEN stock - $1 <= 0 THEN false ELSE true END) WHERE id::text = $2`,
                    [item.quantity || 1, pId.toString()]
                );
            }
        }

        // Reward points (earn 10 points per order, minus any redeemed)
        const pointsRedeemed = Number(req.body.pointsRedeemed || 0);
        if (pointsRedeemed > 0) {
            await query('UPDATE users SET "rewardPoints" = GREATEST(0, COALESCE("rewardPoints", 0) - $1) WHERE id::text = $2', [pointsRedeemed, userId.toString()]);
        }
        await query('UPDATE users SET "rewardPoints" = COALESCE("rewardPoints", 0) + 10 WHERE id::text = $1', [userId.toString()]);

        // Create order confirmation notification
        await query(
            `INSERT INTO notifications ("userId", title, message, type) VALUES ($1, 'Order Confirmed! 🎉', $2, 'order')`,
            [userId.toString(), `Your order of $${amount} has been placed successfully. You earned 10 loyalty reward points!`]
        );

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Stripe Method
const placeOrderStripe = async (req,res) => {
    try {
        if (!stripe) {
            return res.json({ success: false, message: "Stripe payment gateway is not configured on this server." });
        }
        
        const { userId, items, amount, address} = req.body
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Verify Stripe 
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        if (!razorpayInstance) {
            return res.json({ success: false, message: "Razorpay payment gateway is not configured on this server." });
        }
        
        const { userId, items, amount, address} = req.body

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error) {
                console.log(error)
                return res.json({success:false, message: error})
            }
            res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        if (!razorpayInstance) {
            return res.json({ success: false, message: "Razorpay payment gateway is not configured on this server." });
        }
        
        const { userId, razorpay_order_id  } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({ success: true, message: "Payment Successful" })
        } else {
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// All Orders data for Admin Panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({})
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// User Order Data For Forntend
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: 'Status Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Customer Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { userId, orderId, reason } = req.body;
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }
        if (order.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }
        if (order.status === 'Cancelled') {
            return res.json({ success: false, message: 'Order is already cancelled' });
        }
        if (order.status !== 'Order Placed' && order.status !== 'Packing' && order.status !== 'Processing') {
            return res.json({ success: false, message: 'Order cannot be cancelled at this stage' });
        }

        await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        await query(
            `INSERT INTO notifications ("userId", title, message, type) VALUES ($1, 'Order Cancelled', $2, 'order')`,
            [userId.toString(), `Your order #${orderId} has been cancelled successfully.`]
        );
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Customer Request Return
const returnOrder = async (req, res) => {
    try {
        const { userId, orderId, reason } = req.body;
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }
        if (order.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }
        if (order.status !== 'Delivered') {
            return res.json({ success: false, message: 'Only delivered orders can be returned' });
        }

        await orderModel.findByIdAndUpdate(orderId, { status: 'Return Requested' });
        await query(
            `INSERT INTO notifications ("userId", title, message, type) VALUES ($1, 'Return Initiated 📦', $2, 'order')`,
            [userId.toString(), `Return request initiated for order #${orderId}. Pickup will be scheduled shortly.`]
        );
        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    verifyRazorpay,
    verifyStripe,
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus,
    cancelOrder,
    returnOrder
};