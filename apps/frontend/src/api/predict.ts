export * from "./client";
export * from "./transactions";
export * from "./batch";
export * from "./model";
export * from "./alerts";

import { api } from "./client";
export async function getThresholds(): Promise<{ flagThreshold: number; blockThreshold: number }> {
  const response = await api.get("/settings/thresholds");
  return response.data;
}

export async function updateThresholds(flagThreshold: number, blockThreshold: number) {
  const response = await api.put("/settings/thresholds", { flagThreshold, blockThreshold });
  return response.data;
}