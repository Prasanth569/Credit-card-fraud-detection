import { RedisOptions } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

console.log(" Available Env Keys (Debug):", Object.keys(process.env).filter(k => k.includes("REDIS") || k.includes("URL")));

if (REDIS_URL) {
  console.log(" Redis: Using REDIS_URL configuration (Length: " + REDIS_URL.length + ")");
} else {
  console.warn(" Redis: REDIS_URL not found, falling back to 127.0.0.1:6379");
}

export const redisConfig: any = REDIS_URL 
  ? REDIS_URL 
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    };
