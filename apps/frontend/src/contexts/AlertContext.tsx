import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getAlerts, resolveAlert, type Alert } from "../api/alerts";
import { useAuth } from "./AuthContext";

interface AlertContextType {
  alerts: (Alert & { severity: string })[];
  unreadCount: number;
  loading: boolean;
  fetchAlerts: () => Promise<void>;
  markAsResolved: (id: string) => Promise<void>;
  resolveAll: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<(Alert & { severity: string })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlerts({ limit: 50 });
      setAlerts(data.items);
    } catch {
      // API unavailable – keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsResolved = useCallback(async (id: string) => {
    try {
      await resolveAlert(id);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, resolved: true } : a)));
    } catch {
      // fail silent
    }
  }, []);

  const resolveAll = useCallback(async () => {
    const unresolved = alerts.filter((a) => !a.resolved);
    await Promise.allSettled(unresolved.map((a) => resolveAlert(a._id)));
    setAlerts((prev) => prev.map((a) => ({ ...a, resolved: true })));
  }, [alerts]);

  const unreadCount = alerts.filter((a) => !a.resolved).length;

  const { currentUser } = useAuth();

  // Background polling every 30s
  useEffect(() => {
    if (!currentUser) return; // Only start polling if user is logged in
    
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, [fetchAlerts, currentUser]);

  return (
    <AlertContext.Provider value={{ alerts, unreadCount, loading, fetchAlerts, markAsResolved, resolveAll }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
