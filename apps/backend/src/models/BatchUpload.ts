import mongoose, { Schema, Document } from "mongoose";

export interface IBatchUpload extends Document {
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  fraudCount: number;
  status: "processing" | "completed" | "failed";
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchUploadSchema = new Schema<IBatchUpload>(
  {
    fileName: {
      type: String,
      required: true,
    },

    totalRecords: {
      type: Number,
      required: true,
      min: 0,
    },

    processedRecords: {
      type: Number,
      default: 0,
      min: 0,
    },

    fraudCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    uploadedBy: {
      type: String, // firebaseUid
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//  INDEXES
BatchUploadSchema.index({ uploadedBy: 1 });
BatchUploadSchema.index({ createdAt: -1 });

export const BatchUpload = mongoose.model<IBatchUpload>(
  "BatchUpload",
  BatchUploadSchema
);
