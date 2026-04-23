import { FastifyRequest, FastifyReply } from "fastify";
import { adminAuth } from "../config/firebase-admin";

// Extend Fastify request type to include user
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      uid: string;
      email: string;
      name?: string;
    };
  }
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/health", "/simulation/simulate"];

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip auth for public routes
  if (PUBLIC_ROUTES.includes(request.url)) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({
      error: "Unauthorized",
      message: "Authentication required. Please provide a valid token.",
    });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!token) {
    return reply.code(401).send({
      error: "Unauthorized",
      message: "Authentication required. Please provide a valid token.",
    });
  }

  try {
    const auth = adminAuth;
    if (!auth) {
      // If Firebase is not configured, we allow requests for now but log it
      // Alternatively, you could return an error here
      console.warn("⚠️ Auth skipped: adminAuth is not initialized.");
      return;
    }
    const decodedToken = await auth.verifyIdToken(token);

    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || decodedToken.email?.split("@")[0] || "",
    };
  } catch (error: any) {
    // Handle specific Firebase auth errors with user-friendly messages
    if (error.code === "auth/id-token-expired") {
      return reply.code(401).send({
        error: "Token Expired",
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.code === "auth/id-token-revoked") {
      return reply.code(401).send({
        error: "Token Revoked",
        message: "Your session has been revoked. Please log in again.",
      });
    }

    return reply.code(401).send({
      error: "Unauthorized",
      message: "Invalid authentication token. Please log in again.",
    });
  }
}
