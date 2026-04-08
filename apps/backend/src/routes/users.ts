import { FastifyInstance } from "fastify";
import { User } from "../models/User";

export async function usersRoutes(fastify: FastifyInstance) {
  // POST /users/sync — synchronize Firebase user to MongoDB
  fastify.post("/users/sync", async (request, reply) => {
    try {
      const { uid, email, name } = request.user || {};

      if (!uid || !email) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "User information missing from token",
        });
      }

      let user = await User.findOne({ firebaseUid: uid });

      if (!user) {
        // Create new user
        user = await User.create({
          firebaseUid: uid,
          email,
          name: name || email.split("@")[0],
          lastLogin: new Date(),
        });
      } else {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }

      return reply.send({
        message: "User synchronized successfully",
        user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Failed to synchronize user",
      });
    }
  });

  // GET /users/me — get current user profile
  fastify.get("/users/me", async (request, reply) => {
    try {
      const { uid } = request.user || {};

      if (!uid) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const user = await User.findOne({ firebaseUid: uid }).select("-__v");

      if (!user) {
        return reply.code(404).send({
          error: "Not Found",
          message: "User profile not found",
        });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: "Server Error",
        message: "Failed to fetch user profile",
      });
    }
  });
}
