import { api } from "./client";

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

export async function batchPredict(transactions: Array<{ amount: number; time?: number }>): Promise<BatchResult> {
  const response = await api.post<BatchResult>("/transactions/batch", { transactions });
  return response.data;
}
