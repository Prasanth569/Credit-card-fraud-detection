import { FastifyInstance } from "fastify";
import { Transaction, ITransaction } from "../models/Transaction";
import { BatchUpload } from "../models/BatchUpload";
import { preprocessTransaction } from "../services/preprocess";
import { extractFeatures } from "../services/feature";
import { evaluateDecision } from "../services/decision";
import axios from "axios";

import { ENUMS } from "@enums/index";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function transactionRoutes(fastify: FastifyInstance) {
  // GET /transactions — paginated list with filters
  fastify.get(
    "/transactions",
    {
      schema: {
        querystring: {
          type: ENUMS.Common.DataTypes.OBJECT,
          properties: {
            page: { type: ENUMS.Common.DataTypes.NUMBER, default: 1 },
            limit: { type: ENUMS.Common.DataTypes.NUMBER, default: 10 },
            decision: { type: ENUMS.Common.DataTypes.STRING, enum: [ENUMS.Common.Decision.ALLOW, ENUMS.Common.Decision.FLAG, ENUMS.Common.Decision.BLOCK, "ALL"] },
            search: { type: ENUMS.Common.DataTypes.STRING },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { page = 1, limit = 10, decision, search } =
          request.query as any;

        const filter: any = {};
        if (decision && decision !== "ALL") filter.decision = decision;
        if (search) {
          filter.$or = [
            { txnId: { $regex: search, $options: "i" } },
            { ipAddress: { $regex: search, $options: "i" } },
          ];
        }

        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
          Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-features -__v"),
          Transaction.countDocuments(filter),
        ]);

        return reply.send({
          items,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + items.length < total,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: "Query Error",
          message: "Failed to fetch transactions",
        });
      }
    }
  );

  // GET /transactions/:id — single transaction
  fastify.get("/transactions/:id", async (request, reply) => {
    try {
      const { id } = request.params as any;
      const txn = await Transaction.findById(id);
      if (!txn) {
        return reply.code(404).send({ error: "Not Found", message: "Transaction not found" });
      }
      return reply.send(txn);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Query Error", message: "Failed to fetch transaction" });
    }
  });

  // POST /transactions/batch — batch CSV data prediction
  fastify.post(
    "/transactions/batch",
    {
      schema: {
        body: {
          type: ENUMS.Common.DataTypes.OBJECT,
          required: ["transactions"],
          properties: {
            transactions: {
              type: ENUMS.Common.DataTypes.ARRAY,
              items: {
                type: ENUMS.Common.DataTypes.OBJECT,
                properties: {
                  amount: { type: ENUMS.Common.DataTypes.NUMBER },
                  time: { type: ENUMS.Common.DataTypes.NUMBER },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { transactions } = request.body as any;
        if (!Array.isArray(transactions) || transactions.length === 0) {
          return reply.code(400).send({
            error: "Bad Request",
            message: "transactions array is required and must not be empty",
          });
        }
        if (transactions.length > 500) {
          return reply.code(400).send({
            error: "Bad Request",
            message: "Maximum 500 transactions per batch",
          });
        }

        const startProcessingTime = Date.now();
        
        // 1. Preprocess all transactions
        const preprocessedBatch = transactions.map(raw => {
          const preprocessed = preprocessTransaction(raw);
          const features = extractFeatures(preprocessed);
          return { raw, features };
        });

        // 2. Request batch prediction from ML service
        let mlPredictions: any[] = [];
        try {
          const { data } = await axios.post(`${ML_SERVICE_URL}/batch-predict`, {
            transactions: preprocessedBatch.map(p => p.features)
          });
          mlPredictions = data.predictions;
        } catch (error) {
          fastify.log.error(error, "ML Batch Prediction failed, using fallback");
          // Fallback calculation if ML service is down
          mlPredictions = preprocessedBatch.map(p => ({
            probability: Math.min(0.99, p.raw.amount > 2000 ? 0.65 : 0.1),
            flags: []
          }));
        }

        // 3. Evaluate decisions and prepare for bulk insert
        let fraudCount = 0;
        let legitCount = 0;
        let flagCount = 0;
        
        const transactionsToInsert = preprocessedBatch.map((p, index) => {
          const mlResult = mlPredictions[index];
          const probability = mlResult.probability;
          const mlFlags = mlResult.flags || [];
          
          const { decision, riskLevel, flags } = evaluateDecision(
            probability,
            mlFlags,
            p.raw.amount
          );

          if (decision === "BLOCK") fraudCount++;
          else if (decision === "FLAG") flagCount++;
          else legitCount++;

          return {
            amount: p.raw.amount,
            time: p.features.time,
            probability,
            decision,
            flags,
            latencyMs: mlResult.latency_ms || 0,
            modelVersion: "CLN-ARCH-v1.0.42",
            features: p.features,
            source: "csv",
            riskLevel // Not in schema but useful for response
          };
        });

        // 4. Bulk insert into database
        const insertedTxns = await Transaction.insertMany(transactionsToInsert.map(({riskLevel, ...rest}) => rest));

        // 5. Record in BatchUpload history
        try {
          const uid = (request as any).user?.uid || "manual-upload-fallback";
          await BatchUpload.create({
            fileName: `batch_upload_${Date.now()}.json`,
            totalRecords: transactions.length,
            processedRecords: transactionsToInsert.length,
            fraudCount,
            status: "completed",
            uploadedBy: uid,
          });
        } catch (err) {
          fastify.log.error(err, "Failed to record BatchUpload history");
        }

        // 6. Build final results response
        const results = transactionsToInsert.map((t, index) => ({
          txnId: insertedTxns[index].txnId,
          amount: t.amount,
          probability: t.probability,
          decision: t.decision,
          riskLevel: t.riskLevel
        }));

        return reply.send({
          processed: results.length,
          fraudCount,
          legitCount,
          flagCount,
          fraudRate: parseFloat(((fraudCount / results.length) * 100).toFixed(2)),
          totalLatencyMs: Date.now() - startProcessingTime,
          results,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: "Batch Error",
          message: "Batch processing failed",
        });
      }
    }
  );
}
