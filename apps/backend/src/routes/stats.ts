import { FastifyInstance } from "fastify";
import { Transaction } from "../models/Transaction";

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get("/stats", async (request, reply) => {
    try {
      const [totalCount, fraudCount, flagCount] = await Promise.all([
        Transaction.countDocuments(),
        Transaction.countDocuments({ decision: "BLOCK" }),
        Transaction.countDocuments({ decision: "FLAG" }),
      ]);

      const legitCount = totalCount - fraudCount - flagCount;
      const fraudRate =
        totalCount > 0
          ? parseFloat(((fraudCount / totalCount) * 100).toFixed(2))
          : 0;

      // Hourly volume for trend chart (last 8 hours)
      const now = new Date();
      const hourlyTrend = [];
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 3600000);
        const end = new Date(now.getTime() - i * 3600000);
        const count = await Transaction.countDocuments({
          createdAt: { $gte: start, $lt: end },
        });
        const hour = new Date(end);
        hourlyTrend.push({
          label: `${String(hour.getHours()).padStart(2, "0")}:00`,
          count,
        });
      }

      // Recent fraud alerts (last 5 blocked)
      const recentAlerts = await Transaction.find({ decision: "BLOCK" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("txnId amount probability flags createdAt");

      return reply.send({
        total: totalCount,
        fraud: fraudCount,
        legit: legitCount,
        flagged: flagCount,
        fraudRate,
        hourlyTrend,
        recentAlerts,
        // Model comparison data (static — from system design doc)
        modelComparison: [
          { model: "Static Decision Tree", accuracy: 93.1 },
          { model: "Adaptive Hoeffding Tree", accuracy: 95.8 },
          { model: "Hybrid DWM + AHT", accuracy: 97.9 },
        ],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Stats Error",
        message: "Failed to aggregate statistics",
      });
    }
  });
}
