import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = async () => {
    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({
            cloudinary_url: process.env.CLOUDINARY_URL,
            secure: true
        });
        console.log("Cloudinary initialized via CLOUDINARY_URL");
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY,
            secure: true
        });
        console.log(`Cloudinary initialized with Cloud Name: ${process.env.CLOUDINARY_NAME ? process.env.CLOUDINARY_NAME : '(Not Set)'}`);
    }
};

export default connectCloudinary;