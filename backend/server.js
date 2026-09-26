// server.js - Backend server setup
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { initDB } from './config/db.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import adminRouter from './routes/adminRoute.js';
import { adminLogin } from './controllers/userController.js';

import { isSupabaseConfigured } from './config/supabase.js';

// App config
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Storage Providers
initDB();
connectCloudinary();
if (isSupabaseConfigured()) {
  console.log("Supabase Storage is active for product image uploads.");
} else {
  console.log("Supabase Storage not configured yet. (Set SUPABASE_URL & SUPABASE_KEY to activate)");
}

// Configure comprehensive CORS support for Vercel, localhost, and custom domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman) or any origin from Vercel / localhost
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'token',
    'admin_token',
    'x-requested-with',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'token'],
  optionsSuccessStatus: 200
};

// Middlewares - CORS MUST be first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/admin', adminRouter);

// Frontend admin login alias compatibility
app.post('/api/admin/login', adminLogin);

app.get('/', (req, res) => {
  res.send("API Working");
});

// Global error handler with CORS preservation
app.use((err, req, res, next) => {
  console.error("Global server error:", err);
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const server = app.listen(PORT, () => console.log('server running on port :' + PORT));

// Fallback listener on port 4000 so clients requesting either 5000 or 4000 succeed
if (Number(PORT) !== 4000) {
  try {
    const fallbackServer = app.listen(4000, () => console.log('Fallback server also active on port :4000'));
    fallbackServer.on('error', () => {
      // Non-fatal if 4000 is occupied
    });
  } catch (err) {
    // Non-fatal
  }
}