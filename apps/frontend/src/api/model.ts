import { api } from "./client";
import type { Transaction } from "./transactions";

export interface StatsData {
  total: number;
  fraud: number;
  legit: number;
  flagged: number;
  fraudRate: number;
  hourlyTrend: { label: string; count: number }[];
  recentAlerts: Transaction[];
  modelComparison: { model: string; accuracy: number }[];
}

export interface ModelLog {
  _id: string;
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedAt: string;
  notes?: string;
}

export async function getStats(): Promise<StatsData> {
  const response = await api.get<StatsData>("/stats");
  return response.data;
}

export async function getModelLogs(): Promise<ModelLog[]> {
  const response = await api.get<ModelLog[]>("/modellogs");
  return response.data;
}
