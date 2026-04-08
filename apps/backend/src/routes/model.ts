import { FastifyInstance } from "fastify";
import { addModelLogJob } from "../queues/modelQueue";
import { ENUMS } from "@enums/index";

export async function modelRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/model/retrained",
    {
      schema: {
        body: {
          type: ENUMS.Common.DataTypes.OBJECT,
          required: ["modelVersion", "accuracy", "precision", "recall", "f1Score"],
          properties: {
            modelVersion: { type: ENUMS.Common.DataTypes.STRING },
            accuracy: { type: ENUMS.Common.DataTypes.NUMBER },
            precision: { type: ENUMS.Common.DataTypes.NUMBER },
            recall: { type: ENUMS.Common.DataTypes.NUMBER },
            f1Score: { type: ENUMS.Common.DataTypes.NUMBER },
            notes: { type: ENUMS.Common.DataTypes.STRING },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const payload = request.body;
        await addModelLogJob(payload);

        return reply.code(200).send({
          success: true,
          message: "Model retraining log enqueued for processing.",
        });
      } catch (error) {
        fastify.log.error(error, "Failed to process model retrained log");
        return reply.code(500).send({
          error: "Internal Server Error",
        });
      }
    }
  );
}
