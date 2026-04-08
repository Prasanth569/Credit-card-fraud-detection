import { api } from "./client";

export interface Alert {
  _id: string;
  transactionId: string;
  severity: "low" | "medium" | "high";
  message: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAlerts(params?: {
  resolved?: boolean;
  limit?: number;
}): Promise<Alert[]> {
  const response = await api.get<Alert[]>("/alerts", { params });
  return response.data;
}

export async function resolveAlert(id: string): Promise<Alert> {
  const response = await api.put<Alert>(`/alerts/${id}/resolve`);
  return response.data;
}
