import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const modelQueue = new Queue("model-log", {
  connection: redisConfig,
});

export const addModelLogJob = async (data: any) => {
  return await modelQueue.add("model-log", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnFail: false,
  });
};
