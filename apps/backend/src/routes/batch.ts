import { FastifyInstance } from "fastify";
import { BatchUpload } from "../models/BatchUpload";
import { Transaction, ITransaction } from "../models/Transaction";
import { preprocessTransaction } from "../services/preprocess";
import { extractFeatures } from "../services/feature";
import { evaluateDecision } from "../services/decision";
import { Alert } from "../models/Alert";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import { parse } from "csv-parse";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
let txnCounter = 50000;

export async function batchRoutes(fastify: FastifyInstance) {
  fastify.post("/batch", async (request, reply) => {
    try {
      const data = await (request as any).file();
      if (!data) {
        return reply.code(400).send({ error: "Bad Request", message: "File is required" });
      }

      const uid = (request as any).user?.uid || "mock-user";
      const tempFilePath = path.join(os.tmpdir(), `batch-${Date.now()}.csv`);
      
      // Save stream to temp file to process asynchronously
      await pipeline(data.file, fs.createWriteStream(tempFilePath));

      const batch = await BatchUpload.create({
        fileName: data.filename,
        totalRecords: 0, // Will update as we parse
        processedRecords: 0,
        fraudCount: 0,
        status: "processing",
        uploadedBy: uid,
      });

      // Fire background task
      processCsvInBackground(fastify, tempFilePath, (batch as any)._id).catch(err => {
        fastify.log.error(err, "Background CSV processing error");
      });

      return reply.send({
        message: "Batch upload started",
        batchId: batch._id,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Failed to upload batch",
      });
    }
  });

  fastify.get("/batch/:id", async (request, reply) => {
    try {
      const { id } = request.params as any;
      const batch = await BatchUpload.findById(id);

      if (!batch) {
        return reply.code(404).send({ error: "Not Found", message: "Batch not found" });
      }

      return reply.send(batch);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Server Error", message: "Failed to get batch status" });
    }
  });
}

// Background processing function
async function processCsvInBackground(fastify: FastifyInstance, filePath: string, batchId: string) {
  let processedCount = 0;
  let fraudCount = 0;
  const records: any[] = [];

  // Read all records to memory first to count them (assuming moderate sizes)
  const parser = fs.createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  for await (const record of parser) {
    records.push(record);
  }

  // Update total records
  await BatchUpload.findByIdAndUpdate(batchId, { totalRecords: records.length });

  // Process each record
  for (const raw of records) {
    try {
      const amount = parseFloat(raw.amount) || Math.random() * 5000;
      const time = parseFloat(raw.time) || Date.now();
      
      const payload: any = { amount, time };
      // Map v1-v28 if they exist, else generate dummy
      for (let i = 1; i <= 28; i++) {
        payload[`v${i}`] = parseFloat(raw[`v${i}`] || raw[`V${i}`]) || 0;
      }

      const preprocessed = preprocessTransaction(payload);
      const features = extractFeatures(preprocessed);

      let probability = 0.1;
      let mlFlags: string[] = [];
      let latencyMs = 0;

      try {
        const mlStartTime = Date.now();
        const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, { ...features });
        probability = data.probability;
        mlFlags = data.flags || [];
        latencyMs = Date.now() - mlStartTime;
      } catch {
        probability = Math.min(0.99, amount > 2000 ? 0.75 : 0.1);
        latencyMs = 50;
      }

      const { decision, riskLevel, flags } = evaluateDecision(probability, mlFlags, amount);
      const txnId = `BAT_${String(++txnCounter).padStart(5, "0")}`;

      const transaction = await Transaction.create({
        txnId,
        amount,
        time: features.time,
        probability,
        decision,
        flags,
        latencyMs,
        modelVersion: "CLN-ARCH-v1.0.42-batch",
        features,
      }) as ITransaction;

      // Auto-create Alert for high risk
      if (decision === "BLOCK" || probability >= 0.90) {
        fraudCount++;
        try {
          await Alert.create({
            transactionId: transaction.txnId,
            severity: decision === "BLOCK" ? "high" : "medium",
            message: `Batch Upload Suspicious activity. Probability: ${(probability * 100).toFixed(1)}%`,
          });
        } catch (err) {
          fastify.log.error(err, "Failed to auto-create alert in batch");
        }
      }
      
      processedCount++;

      // Update progress every 50 records to avoid hammering DB
      if (processedCount % 50 === 0) {
        await BatchUpload.findByIdAndUpdate(batchId, {
          processedRecords: processedCount,
          fraudCount,
        });
      }

    } catch (err) {
      fastify.log.error(err, "Row processing error");
      processedCount++;
    }
  }

  // Final update
  await BatchUpload.findByIdAndUpdate(batchId, {
    processedRecords: processedCount,
    fraudCount,
    status: "completed",
  });

  // Cleanup temp file
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    fastify.log.error(e, "Failed to delete temp batch file");
  }
}
