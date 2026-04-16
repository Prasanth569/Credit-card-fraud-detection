import { useState, useMemo } from "react";
import { useAlerts } from "../contexts/AlertContext";
import { Link } from "react-router-dom";

type SeverityFilter = "ALL" | "high" | "medium" | "low";
type StatusFilter = "ALL" | "ACTIVE" | "RESOLVED";

const SEVERITY_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  high: { icon: "warning", color: "text-danger", bg: "bg-danger/5", border: "border-danger/30" },
  critical: { icon: "error", color: "text-danger", bg: "bg-danger/5", border: "border-danger/30" },
  medium: { icon: "info", color: "text-warning", bg: "bg-warning/5", border: "border-warning/30" },
  low: { icon: "check_circle", color: "text-primary", bg: "bg-primary/5", border: "border-primary/30" },
};

export default function AlertCenter() {
  const { alerts, loading, unreadCount, markAsResolved, resolveAll } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
      if (statusFilter === "ACTIVE" && a.resolved) return false;
      if (statusFilter === "RESOLVED" && !a.resolved) return false;
      if (search && !a.message.toLowerCase().includes(search.toLowerCase()) &&
          !a.transactionId.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter((a) => !a.resolved).length,
    high: alerts.filter((a) => ((a.severity as string) === "high" || (a.severity as string) === "critical") && !a.resolved).length,
    medium: alerts.filter((a) => a.severity === "medium" && !a.resolved).length,
    low: alerts.filter((a) => a.severity === "low" && !a.resolved).length,
  }), [alerts]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-dark rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-neutral/50" />
          ))}
        </div>
        <div className="card h-96 animate-pulse bg-neutral/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-on-surface">Alert Center</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Monitor and manage fraud detection alerts in real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-success-light rounded-full text-[10px] font-bold text-success uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live
          </span>

          {unreadCount > 0 && (
            <button
              onClick={resolveAll}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Resolve All ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Alerts", value: stats.total, icon: "notifications", color: "text-on-surface", bg: "bg-neutral" },
          { label: "Active", value: stats.active, icon: "error_outline", color: "text-danger", bg: "bg-danger/5" },
          { label: "High Severity", value: stats.high, icon: "warning", color: "text-danger", bg: "bg-danger/5" },
          { label: "Medium", value: stats.medium, icon: "info", color: "text-warning", bg: "bg-warning/5" },
          { label: "Low", value: stats.low, icon: "check_circle", color: "text-primary", bg: "bg-primary/5" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="card p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[16px] ${color}`}>{icon}</span>
              </div>
            </div>
            <p className={`text-2xl font-black font-headline ${color}`}>{value}</p>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by message or TXN ID…"
              className="input-base pl-9"
            />
          </div>

          {/* Severity filter */}
          <div className="flex gap-1.5">
            {(["ALL", "high", "medium", "low"] as SeverityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSeverityFilter(f)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${severityFilter === f
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-neutral border border-outline-variant/30"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {(["ALL", "ACTIVE", "RESOLVED"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${statusFilter === f
                    ? "bg-secondary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-neutral border border-outline-variant/30"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card py-16 text-center animate-fade-in">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-3">
              notifications_paused
            </span>
            <p className="text-on-surface-variant font-medium">No alerts match your filters</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
            return (
              <div
                key={alert._id}
                className={`card p-5 animate-fade-in border-l-4 ${cfg.border} transition-all hover:shadow-card-hover ${
                  alert.resolved ? "opacity-60" : ""
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Severity Icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[20px] ${cfg.color}`}>{cfg.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {alert.severity}
                      </span>
                      {alert.resolved ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-success-light text-success">
                          Resolved
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-danger/10 text-danger animate-pulse">
                          Active
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant ml-auto">{formatDate(alert.createdAt)}</span>
                    </div>

                    <p className="text-sm text-on-surface font-medium leading-relaxed mb-2">{alert.message}</p>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/transactions?search=${alert.transactionId}`}
                        className="text-[11px] font-bold text-primary hover:underline hover:text-primary-dark flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        TXN #{alert.transactionId.slice(-8)}
                      </Link>
                      {!alert.resolved && (
                        <button
                          onClick={() => markAsResolved(alert._id)}
                          className="text-[11px] font-bold text-success hover:underline flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      {filteredAlerts.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-on-surface-variant">
            Showing {filteredAlerts.length} of {alerts.length} alerts · Auto-refreshing every 30s
          </p>
        </div>
      )}
    </div>
  );
}
