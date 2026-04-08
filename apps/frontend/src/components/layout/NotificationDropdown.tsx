import { useEffect, useState } from "react";
import { useAlerts } from "../../contexts/AlertContext";
import { Link } from "react-router-dom";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { alerts, fetchAlerts, markAsResolved } = useAlerts();
  const [polling, setPolling] = useState(false);

  // Dynamic Polling: Only poll every 10s if the dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    fetchAlerts(); // Immediate fetch when opened

    const interval = setInterval(() => {
      setPolling(true);
      fetchAlerts().finally(() => setPolling(false));
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, fetchAlerts]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-outline-variant/40 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-50 flex flex-col">
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between bg-neutral/30">
        <h3 className="font-bold text-sm text-on-surface font-headline">Live Alerts</h3>
        <div className="flex items-center gap-2">
          {polling && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            {alerts.filter((a) => !a.resolved).length} Unread
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50 block">notifications_paused</span>
            No active alerts
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/15">
            {alerts.filter((a) => !a.resolved).map((alert) => (
              <div
                key={alert._id}
                className={`p-4 transition-colors hover:bg-neutral/40 ${
                  alert.severity === "high" ? "bg-danger/5" : "bg-warning/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="mt-0.5">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        alert.severity === "high" ? "text-danger" : "text-warning"
                      }`}
                    >
                      {alert.severity === "high" ? "warning" : "error"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface mb-1">
                      {alert.severity.toUpperCase()} ALERT
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed break-words">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <Link
                        to={`/transactions?search=${alert.transactionId}`}
                        onClick={onClose}
                        className="text-[11px] font-bold text-primary hover:underline hover:text-primary-dark"
                      >
                        View TXN #{alert.transactionId.slice(-5)}
                      </Link>
                      <button
                        onClick={() => markAsResolved(alert._id)}
                        className="text-[11px] font-bold text-success hover:underline transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {alerts.some((a) => !a.resolved) && (
        <div className="px-4 py-2 border-t border-outline-variant/20 bg-neutral/10 text-center">
          <p className="text-[10px] text-on-surface-variant">Auto-updating every 10s</p>
        </div>
      )}
    </div>
  );
}
