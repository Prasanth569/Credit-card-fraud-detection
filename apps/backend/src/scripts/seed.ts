import mongoose from "mongoose";
import { Transaction } from "../models/Transaction";
import { ModelLog } from "../models/ModelLog";
import { connectDB } from "../config/db";

async function seed() {
  try {
    await connectDB();

    console.log("Seeding database...");

    // Clear existing data to avoid duplicates
    await Transaction.deleteMany({ source: "simulation" });
    await ModelLog.deleteMany({});

    const transactions = [];
    const now = new Date();

    // Generate 1000 transactions over the last 24 hours
    for (let i = 0; i < 1000; i++) {
        const timeOffset = Math.random() * 24 * 3600000; // random milliseconds in last 24h
        const createdAt = new Date(now.getTime() - timeOffset);
        
        // Distribution: 98% ALLOW, 1.5% FLAG, 0.5% BLOCK
        const rand = Math.random();
        let decision: "ALLOW" | "FLAG" | "BLOCK" = "ALLOW";
        let probability = Math.random() * 0.3; // Low prob for legit
        let flags: string[] = [];

        if (rand < 0.005) {
            decision = "BLOCK";
            probability = 0.85 + Math.random() * 0.15;
            flags = ["HIGH_AMOUNT", "VELOCITY_LIMIT", "IP_GEO_MISMATCH"];
        } else if (rand < 0.02) {
            decision = "FLAG";
            probability = 0.6 + Math.random() * 0.2;
            flags = ["IP_GEO_MISMATCH"];
        }

        transactions.push({
            txnId: `TXN_SEED_${now.getTime()}_${i}`,
            amount: Math.floor(Math.random() * 5000) + 10,
            time: Math.floor(createdAt.getTime() / 1000), 
            probability,
            decision,
            flags,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            latencyMs: Math.floor(Math.random() * 150) + 20,
            modelVersion: "CLN-ARCH-v1.0.42",
            source: "simulation",
            createdAt,
        });
    }

    await Transaction.insertMany(transactions);
    console.log(`Inserted ${transactions.length} transactions.`);

    // Generate some model logs for the last 5 weeks
    const modelLogs = [];
    for (let i = 5; i >= 0; i--) {
        const trainedAt = new Date(now.getTime() - i * 7 * 24 * 3600000); // weekly logs
        modelLogs.push({
            modelVersion: `v1.0.${42 - i}`,
            accuracy: 0.94 + (5 - i) * 0.005,
            precision: 0.92 + (5 - i) * 0.006,
            recall: 0.90 + (5 - i) * 0.008,
            f1Score: 0.91 + (5 - i) * 0.009,
            trainedAt,
            notes: i === 0 ? "Latest hybrid ensemble — DWM + AHT" : "Model performance update",
        });
    }

    await ModelLog.insertMany(modelLogs);
    console.log(`Inserted ${modelLogs.length} model logs.`);

    console.log("Database seeded successfully! 🚀");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
