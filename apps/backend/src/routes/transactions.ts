import { FastifyInstance } from "fastify";
import { Transaction, ITransaction } from "../models/Transaction";
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

        const results = [];
        let fraudCount = 0;
        let legitCount = 0;
        let flagCount = 0;

        for (const raw of transactions) {
          try {
            const preprocessed = preprocessTransaction(raw);
            const features = extractFeatures(preprocessed);

            let probability = 0.1;
            let mlFlags: string[] = [];

            try {
              const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
                amount: features.amount,
                time: features.time,
                v1: features.v1, v2: features.v2, v3: features.v3,
                v4: features.v4, v5: features.v5, v6: features.v6,
                v7: features.v7, v8: features.v8, v9: features.v9,
                v10: features.v10, v11: features.v11, v12: features.v12,
                v13: features.v13, v14: features.v14, v15: features.v15,
                v16: features.v16, v17: features.v17, v18: features.v18,
                v19: features.v19, v20: features.v20, v21: features.v21,
                v22: features.v22, v23: features.v23, v24: features.v24,
                v25: features.v25, v26: features.v26, v27: features.v27,
                v28: features.v28,
              });
              probability = data.probability;
              mlFlags = data.flags || [];
            } catch {
              probability = Math.min(0.99, raw.amount > 2000 ? 0.65 : 0.1);
            }

            const { decision, riskLevel, flags } = evaluateDecision(
              probability,
              mlFlags,
              raw.amount
            );

            const txn = (await Transaction.create({
              amount: raw.amount,
              time: features.time,
              probability,
              decision,
              flags,
              latencyMs: 0,
              modelVersion: "CLN-ARCH-v1.0.42",
              features,
            })) as ITransaction;

            if (decision === "BLOCK") fraudCount++;
            else if (decision === "FLAG") flagCount++;
            else legitCount++;

            results.push({ txnId: txn.txnId, amount: raw.amount, probability, decision, riskLevel });
          } catch {
            results.push({ amount: raw.amount, error: "Processing failed" });
          }
        }

        return reply.send({
          processed: results.length,
          fraudCount,
          legitCount,
          flagCount,
          fraudRate: parseFloat(((fraudCount / results.length) * 100).toFixed(2)),
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
