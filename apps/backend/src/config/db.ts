import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("MongoDB Atlas connected 🚀");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};