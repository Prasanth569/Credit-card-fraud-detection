import { FastifyInstance } from "fastify";
import { getThresholds, setThresholds } from "../services/decision";

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get("/settings/thresholds", async (_request, reply) => {
    return reply.send(getThresholds());
  });

  fastify.put(
    "/settings/thresholds",
    {
      schema: {
        body: {
          type: "object",
          required: ["flagThreshold", "blockThreshold"],
          properties: {
            flagThreshold: { type: "number", minimum: 0, maximum: 1 },
            blockThreshold: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { flagThreshold, blockThreshold } = request.body as any;
        setThresholds(flagThreshold, blockThreshold);
        return reply.send({
          message: "Thresholds updated successfully",
          thresholds: getThresholds(),
        });
      } catch (err: any) {
        return reply.code(400).send({ error: "Invalid Thresholds", message: err.message });
      }
    }
  );
}
