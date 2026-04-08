import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const alertQueue = new Queue("generate-alert", {
  connection: redisConfig,
});

export const addAlertJob = async (data: any) => {
  return await alertQueue.add("generate-alert", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnFail: false,
  });
};
