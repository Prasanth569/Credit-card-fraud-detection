import Fastify from "fastify";
import cors from "@fastify/cors";
import { connectDB } from "./config/db";
import { predictRoutes } from "./routes/predict";
import { transactionRoutes } from "./routes/transactions";
import { statsRoutes } from "./routes/stats";
import { settingsRoutes } from "./routes/settings";
import { usersRoutes } from "./routes/users";
import { alertsRoutes } from "./routes/alerts";
import { batchRoutes } from "./routes/batch";
import { modelLogsRoutes } from "./routes/modellogs";
import { simulationRoutes } from "./routes/simulation";
import { modelRoutes } from "./routes/model";

import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";

import { authMiddleware } from "./middleware/auth";

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, { origin: "*" });

// Auth Middleware (global)
fastify.addHook("preHandler", authMiddleware);

// Health
fastify.get("/", async () => ({ message: "Fraud Detection API running 🚀" }));

// Plugins
fastify.register(multipart);
fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Routes
fastify.register(predictRoutes);
fastify.register(transactionRoutes);
fastify.register(statsRoutes);
fastify.register(settingsRoutes);
fastify.register(usersRoutes);
fastify.register(alertsRoutes);
fastify.register(batchRoutes);
fastify.register(modelLogsRoutes);
fastify.register(simulationRoutes);
fastify.register(modelRoutes, { preHandler: [] });

// Global error handler
fastify.setErrorHandler((error: any, _request, reply) => {
  fastify.log.error(error);
  reply.code(error.statusCode || 500).send({
    error: error.name || "Server Error",
    message: error.message || "An unexpected error occurred",
  });
});

const start = async () => {
  try {
    await connectDB();
    await fastify.listen({ port: 5000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();