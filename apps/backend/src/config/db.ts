import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async (retryCount = 5) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${i + 1}/${retryCount})...`);
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

      if (!uri) {
        throw new Error("MongoDB connection string (MONGO_URI or MONGODB_URI) is missing.");
      }

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      console.log("MongoDB Atlas connected 🚀");
      return;
    } catch (error) {
      console.error(`MongoDB connection failed (attempt ${i + 1}/${retryCount})`);
      if (i === retryCount - 1) {
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};