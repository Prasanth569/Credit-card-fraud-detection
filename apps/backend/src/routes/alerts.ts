import { FastifyInstance } from "fastify";
import { Alert } from "../models/Alert";

export async function alertsRoutes(fastify: FastifyInstance) {
  // GET /alerts — fetch recent alerts (paginated)
  fastify.get("/alerts", async (request, reply) => {
    try {
      const { page = 1, limit = 10, status } = request.query as any;
      const skip = (page - 1) * limit;

      const filter: any = {};
      
      // Match status unresolved/resolved if passed, otherwise default to all
      if (status === "resolved") {
        filter.resolved = true;
      } else if (status === "unresolved") {
        filter.resolved = false;
      }

      const [items, total] = await Promise.all([
        Alert.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Alert.countDocuments(filter),
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
        message: "Failed to fetch alerts",
      });
    }
  });

  // PUT /alerts/:id/resolve — resolve an alert
  fastify.put("/alerts/:id/resolve", async (request, reply) => {
    try {
      const { id } = request.params as any;

      const alert = await Alert.findById(id);

      if (!alert) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Alert not found",
        });
      }

      alert.resolved = true;
      await alert.save();

      return reply.send({
        message: "Alert resolved successfully",
        alert,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Failed to resolve alert",
      });
    }
  });
}
