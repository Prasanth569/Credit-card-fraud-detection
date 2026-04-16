import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  type TransactionsResponse,
} from "../api/predict";
import { useSearchParams } from "react-router-dom";
import { ENUMS } from "@enums/index";
import BatchUploadPanel from "../components/dashboard/BatchUploadPanel";

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === ENUMS.Common.Decision.ALLOW) return <span className="badge-allow">{decision}</span>;
  if (decision === ENUMS.Common.Decision.BLOCK) return <span className="badge-block">{decision}</span>;
  return <span className="badge-flag">{decision}</span>;
}

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("decision") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactions({
        page,
        limit: 15,
        decision: filter !== "ALL" ? filter : undefined,
        search: search || undefined,
      });
      setData(res);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      : "—";

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-on-surface">Transactions</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Browse, search, and analyze all processed transactions
          </p>
        </div>
      </div>

      {/* Batch Upload Panel */}
      <BatchUploadPanel onComplete={() => fetchData()} />


      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Transaction ID or IP…"
                className="input-base pl-9"
              />
            </div>
          </form>

          <div className="flex gap-1.5">
            {["ALL", ENUMS.Common.Decision.ALLOW, ENUMS.Common.Decision.FLAG, ENUMS.Common.Decision.BLOCK].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${filter === f
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-neutral border border-outline-variant/30"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-neutral rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-3">
                search_off
              </span>
              <p className="text-on-surface-variant font-medium">No transactions found</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Try adjusting your filters or run a prediction first
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-neutral/60 border-b border-outline-variant/20">
                  <th className="px-5 py-3">TXN ID</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">Probability</th>
                  <th className="px-5 py-3">Decision</th>
                  <th className="px-5 py-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {items.map((txn, idx) => (
                  <tr
                    key={txn._id ?? idx}
                    className="hover:bg-neutral/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-5 py-3 font-mono-code text-xs text-on-surface-variant">
                      #{txn.txnId}
                    </td>
                    <td className="px-5 py-3 font-bold text-sm text-on-surface">
                      ₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-xs text-on-surface-variant">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-mono-code text-xs text-on-surface-variant">
                      {txn.ipAddress}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="prob-bar-track w-14">
                          <div
                            className={`h-full rounded-full ${
                              txn.probability > 0.7
                                ? "bg-danger"
                                : txn.probability > 0.3
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{ width: `${Math.round(txn.probability * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono-code">{txn.probability.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <DecisionBadge decision={txn.decision} />
                    </td>
                    <td className="px-5 py-3">
                      {txn.flags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {txn.flags.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="text-[9px] bg-neutral px-1.5 py-0.5 rounded text-on-surface-variant font-medium"
                              title={f}
                            >
                              {f.replace(/_/g, " ").slice(0, 20)}
                            </span>
                          ))}
                          {txn.flags.length > 2 && (
                            <span className="text-[9px] text-on-surface-variant">
                              +{txn.flags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-outline-variant/20 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/40 disabled:opacity-30 hover:bg-neutral transition-colors"
              >
                Previous
              </button>
              <button
                disabled={!data.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/40 disabled:opacity-30 hover:bg-neutral transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
