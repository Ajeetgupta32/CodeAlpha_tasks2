// server.js - Backend server setup
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';

// App congfig

const app = express()
const PORT =process.env.PORT|| 5000
connectDB();
connectCloudinary();

// middlewares

app.use(express.json());
app.use(cors());

// api endpoint
app.use ('/api/user',userRouter)

app.get('/',(req,res)=>{
  res.send("API Working")
})


app.listen(PORT, ()=>console.log('server running on port :'+ PORT))