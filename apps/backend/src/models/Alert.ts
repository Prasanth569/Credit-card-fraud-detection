import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  transactionId: string;
  severity: "low" | "medium" | "high";
  message: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    transactionId: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

//  INDEXES
AlertSchema.index({ severity: 1 });
AlertSchema.index({ createdAt: -1 });

export const Alert = mongoose.model<IAlert>("Alert", AlertSchema);
