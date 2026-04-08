import mongoose, { Schema, Document } from "mongoose";

export interface IModelLog extends Document {
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedAt: Date;
  notes?: string;
}

const ModelLogSchema = new Schema<IModelLog>(
  {
    modelVersion: {
      type: String,
      required: true,
    },

    accuracy: {
      type: Number,
      min: 0,
      max: 1,
    },

    precision: {
      type: Number,
      min: 0,
      max: 1,
    },

    recall: {
      type: Number,
      min: 0,
      max: 1,
    },

    f1Score: {
      type: Number,
      min: 0,
      max: 1,
    },

    trainedAt: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

//  INDEXES
ModelLogSchema.index({ modelVersion: 1 });
ModelLogSchema.index({ trainedAt: -1 });

export const ModelLog = mongoose.model<IModelLog>(
  "ModelLog",
  ModelLogSchema
);
