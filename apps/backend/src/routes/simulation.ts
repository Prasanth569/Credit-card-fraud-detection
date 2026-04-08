import { FastifyInstance } from "fastify";
import { Transaction, ITransaction } from "../models/Transaction";
import { Alert } from "../models/Alert";
import { evaluateDecision } from "../services/decision";

// Simplified dummy data for v1-v28
const generateDummyFeatures = () => {
  const f: any = {};
  for (let i = 1; i <= 28; i++) f[`v${i}`] = Math.random() * 2 - 1;
  return f;
};

export async function simulationRoutes(fastify: FastifyInstance) {
  fastify.post("/simulation/simulate", async (request, reply) => {
    try {
      const { count = 20 } = request.body as any || {};
      const transactions = [];

      for (let i = 0; i < count; i++) {
        let amount = 0;
        let probability = 0.1;
        const isFraud = Math.random() < 0.2; // 20% fraud rate

        if (isFraud) {
          amount = 8000 + Math.random() * 2000;
          probability = 0.8 + Math.random() * 0.2;
        } else {
          amount = Math.random() * 2000;
          probability = Math.random() * 0.3;
        }

        const features = {
          amount,
          time: Date.now() - Math.random() * 100000,
          ...generateDummyFeatures()
        };

        const { decision, riskLevel, flags } = evaluateDecision(probability, isFraud ? ["anomaly"] : [], amount);
        
        const txnId = `SIM_${Date.now()}_${i}`;

        const txn = await Transaction.create({
          txnId,
          amount,
          time: features.time,
          probability,
          decision,
          flags,
          source: "simulation",
          latencyMs: Math.floor(Math.random() * 100),
          modelVersion: "SIMULATION-v1.0",
          features,
        }) as ITransaction;

        if (decision === "BLOCK" || probability >= 0.90) {
          try {
            await Alert.create({
              transactionId: txn.txnId,
              severity: decision === "BLOCK" ? "high" : "medium",
              message: `Simulated high risk activity. Probability: ${(probability * 100).toFixed(1)}%`,
            });
          } catch (e) {}
        }

        transactions.push(txn);
      }

      return reply.send({
        message: "Simulation complete",
        count: transactions.length,
        transactions,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Simulation failed",
      });
    }
  });
}
