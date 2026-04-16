import { useEffect, useState, useCallback } from "react";
import { getTransactions, type Transaction } from "../../api/predict";
import { ENUMS } from "@enums/index";

interface Props {
  refreshKey?: number;
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === ENUMS.Common.Decision.ALLOW) return <span className="badge-allow">{decision}</span>;
  if (decision === ENUMS.Common.Decision.BLOCK) return <span className="badge-block">{decision}</span>;
  return <span className="badge-flag">{decision}</span>;
}

function ProbBar({ probability }: { probability: number }) {
  const safeProbability = Number.isFinite(probability) ? probability : 0;
  const color =
    safeProbability > 0.7 ? "bg-danger" : safeProbability > 0.3 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="prob-bar-track w-14">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.round(safeProbability * 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono-code font-medium text-on-surface-variant">
        {safeProbability.toFixed(2)}
      </span>
    </div>
  );
}

export default function RecentActivity({ refreshKey }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getTransactions({ limit: 8 });
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setTransactions(items);
    } catch {
      setTransactions([]);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getDecision = (decision?: string) => {
    if (
      decision === ENUMS.Common.Decision.ALLOW ||
      decision === ENUMS.Common.Decision.BLOCK ||
      decision === ENUMS.Common.Decision.FLAG
    ) {
      return decision;
    }
    return ENUMS.Common.Decision.FLAG;
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
        <h2 className="text-base font-black font-headline text-on-surface">Recent Activity</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        {loading ? (
          <div className="divide-y divide-outline-variant/20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-6 animate-pulse">
                <div className="h-3 bg-neutral-dark rounded w-24" />
                <div className="h-3 bg-neutral-dark rounded w-16" />
                <div className="h-3 bg-neutral-dark rounded w-14" />
                <div className="h-3 bg-neutral-dark rounded w-20" />
                <div className="h-3 bg-neutral-dark rounded w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-sm text-danger">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 block mb-2">
              inbox
            </span>
            <p className="text-sm text-on-surface-variant">No transactions yet. Run a prediction to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-neutral/60 border-b border-outline-variant/20">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Probability</th>
                <th className="px-6 py-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {transactions.map((txn, idx) => (
                <tr
                  key={txn._id ?? idx}
                  className="hover:bg-neutral/60 transition-colors cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono-code text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                      #{txn.txnId ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-sm text-on-surface">
                      ₹{Number(txn.amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-on-surface-variant">
                      {txn.createdAt ? formatTime(txn.createdAt) : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <ProbBar probability={Number(txn.probability ?? 0)} />
                  </td>
                  <td className="px-6 py-3.5">
                    <DecisionBadge decision={getDecision(txn.decision)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
