import { FastifyInstance } from "fastify";
import { ModelLog } from "../models/ModelLog";

export async function modelLogsRoutes(fastify: FastifyInstance) {
  // GET /model-logs — fetch model training logs/metrics
  fastify.get("/model-logs", async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query as any;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ModelLog.find()
          .sort({ trainedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        ModelLog.countDocuments(),
      ]);

      return reply.send({
        items,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + items.length < total,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Failed to fetch model logs",
      });
    }
  });

  // Optional: POST to add metric log directly (primarily used by internal ML hooks)
  fastify.post("/model-logs", async (request, reply) => {
    try {
      const logData = request.body as any;
      const log = await ModelLog.create(logData);
      return reply.code(201).send(log);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Server Error", message: "Failed to create model log" });
    }
  });
}
