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

// App config
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Services
initDB();
connectCloudinary();

// Middlewares
app.use(express.json());
app.use(cors());

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