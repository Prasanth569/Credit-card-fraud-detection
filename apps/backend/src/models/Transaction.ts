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
  // V1-V28 features (stored for retraining)
  features: Record<string, number>;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txnId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `TXN_${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
    },
    amount: { type: Number, required: true },
    time: { type: Number, required: true },
    probability: { type: Number, required: true },
    decision: {
      type: String,
      enum: ["ALLOW", "FLAG", "BLOCK"],
      required: true,
    },
    flags: { type: [String], default: [] },
    ipAddress: { type: String, default: "0.0.0.0" },
    latencyMs: { type: Number, default: 0 },
    modelVersion: { type: String, default: "CLN-ARCH-v1.0.42" },
    features: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for fast queries
TransactionSchema.index({ decision: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
