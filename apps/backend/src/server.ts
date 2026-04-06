import Fastify from "fastify";
import cors from "@fastify/cors";
import { connectDB } from "./config/db";
import { predictRoutes } from "./routes/predict";
import { transactionRoutes } from "./routes/transactions";
import { statsRoutes } from "./routes/stats";
import { settingsRoutes } from "./routes/settings";

import { authMiddleware } from "./middleware/auth";

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, { origin: "*" });

// Auth Middleware (global)
fastify.addHook("preHandler", authMiddleware);

// Health
fastify.get("/", async () => ({ message: "Fraud Detection API running 🚀" }));

// Routes
fastify.register(predictRoutes);
fastify.register(transactionRoutes);
fastify.register(statsRoutes);
fastify.register(settingsRoutes);

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