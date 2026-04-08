import { api } from "./client";
import { ENUMS } from "@enums/index";

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

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
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

export async function predictTransaction(data: {
  amount: number;
  time?: number;
  ipAddress?: string;
}): Promise<PredictionResult> {
  const response = await api.post<PredictionResult>("/predict", data);
  return response.data;
}
