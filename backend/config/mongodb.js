import mongoose from "mongoose";

const connectDB = async () => {
            mongoose.connection.on('connected',() => {
                console.log("DB connected");
                
            })

  await mongoose.connect('mongodb+srv://ajeetkit2409:ajeet123@cluster0.kjtrs9v.mongodb.net/');
};


export default connectDB;