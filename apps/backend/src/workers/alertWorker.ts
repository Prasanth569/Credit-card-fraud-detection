import { Worker } from "bullmq";
import { redisConfig } from "../config/redis";
import { Alert } from "../models/Alert";

export const alertWorker = new Worker(
  "generate-alert",
  async (job) => {
    const txn = job.data;

    // Worker decides if alert is needed
    if (txn.decision === "BLOCK" || txn.probability >= 0.9) {
      const severity = txn.decision === "BLOCK" ? "high" : "medium";
      const message = `Suspicious activity detected. Probability: ${(txn.probability * 100).toFixed(1)}%`;

      await Alert.create({
        transactionId: txn.txnId,
        severity,
        message,
      });

      console.log(`[AlertWorker] Created ${severity} severity alert for transaction ${txn.txnId}`);
    } else {
       // Just returning, no alert needed.
       console.log(`[AlertWorker] Transaction ${txn.txnId} is safe. No alert generated.`);
    }
  },
  { connection: redisConfig }
);

alertWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed (generate-alert)`);
});

alertWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed (generate-alert)`, err);
});
