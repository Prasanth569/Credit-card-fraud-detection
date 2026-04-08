import { connectDB } from "../config/db";
import "./alertWorker";
import "./modelWorker";

const startWorkers = async () => {
  try {
    await connectDB();
    console.log("Workers running...");
  } catch (err) {
    console.error("Failed to start workers:", err);
    process.exit(1);
  }
};

startWorkers();
