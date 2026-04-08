import { Worker } from "bullmq";
import { redisConfig } from "../config/redis";
import { ModelLog } from "../models/ModelLog";

export const modelWorker = new Worker(
  "model-log",
  async (job) => {
    const logData = job.data;
    await ModelLog.create(logData);
    console.log(`[ModelWorker] Created model log for version ${logData.modelVersion}`);
  },
  { connection: redisConfig }
);

modelWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed (model-log)`);
});

modelWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed (model-log)`, err);
});
