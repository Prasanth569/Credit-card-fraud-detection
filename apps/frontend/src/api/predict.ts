import { ENUMS } from "@enums/index";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PredictionResult {
  txnId: string;
  probability: number;
  decision: typeof ENUMS.Common.Decision[keyof typeof ENUMS.Common.Decision];
  riskLevel: "low" | "medium" | "high" | "critical";
  riskLabel: string;
  flags: string[];
  latencyMs: number;
  modelVersion: string;
  amount: number;
}

export interface Transaction {
  _id?: string;
  txnId: string;
  amount: number;
  time: number;
  probability: number;
  decision: typeof ENUMS.Common.Decision[keyof typeof ENUMS.Common.Decision];
  flags: string[];
  ipAddress: string;
  latencyMs: number;
  modelVersion: string;
  createdAt?: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
}

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

export interface BatchResult {
  processed: number;
  fraudCount: number;
  legitCount: number;
  flagCount: number;
  fraudRate: number;
  results: Array<{
    txnId?: string;
    amount: number;
    probability: number;
    decision: string;
    riskLevel: string;
    error?: string;
  }>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function predictTransaction(data: {
  amount: number;
  time?: number;
  ipAddress?: string;
}): Promise<PredictionResult> {
  const response = await api.post<PredictionResult>("/predict", data);
  return response.data;
}

export async function getTransactions(params?: {
  page?: number;
  limit?: number;
  decision?: string;
  search?: string;
}): Promise<TransactionsResponse> {
  const response = await api.get<TransactionsResponse>("/transactions", { params });
  return response.data;
}

export async function getStats(): Promise<StatsData> {
  const response = await api.get<StatsData>("/stats");
  return response.data;
}

export async function batchPredict(transactions: Array<{ amount: number; time?: number }>): Promise<BatchResult> {
  const response = await api.post<BatchResult>("/transactions/batch", { transactions });
  return response.data;
}

export async function getThresholds(): Promise<{ flagThreshold: number; blockThreshold: number }> {
  const response = await api.get("/settings/thresholds");
  return response.data;
}

export async function updateThresholds(flagThreshold: number, blockThreshold: number) {
  const response = await api.put("/settings/thresholds", { flagThreshold, blockThreshold });
  return response.data;
}