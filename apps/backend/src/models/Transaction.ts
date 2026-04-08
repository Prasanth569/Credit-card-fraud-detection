import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  txnId: string;
  amount: number;
  time: number;
  probability: number;
  decision: "ALLOW" | "FLAG" | "BLOCK";
  flags: string[];
  ipAddress: string;
  latencyMs: number;
  modelVersion: string;
  features: Record<string, number>;
  source: "manual" | "csv" | "simulation";
  userId?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txnId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    },

    amount: { type: Number, required: true },
    time: { type: Number, required: true },

    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    decision: {
      type: String,
      enum: ["ALLOW", "FLAG", "BLOCK"],
      required: true,
    },

    flags: { type: [String], default: [] },

    ipAddress: { type: String, default: "0.0.0.0" },

    latencyMs: { type: Number, default: 0 },

    modelVersion: {
      type: String,
      default: "CLN-ARCH-v1.0.42",
    },

    features: {
      type: Map,
      of: Number,
      default: {},
    },

    source: {
      type: String,
      enum: ["manual", "csv", "simulation"],
      default: "manual",
    },

    userId: { type: String },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ decision: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ userId: 1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
