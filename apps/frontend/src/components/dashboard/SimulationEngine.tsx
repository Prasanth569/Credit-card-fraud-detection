import { useState } from "react";
import { predictTransaction, type PredictionResult } from "../../api/predict";

interface Props {
  onResult: (result: PredictionResult) => void;
  onLoading: (loading: boolean) => void;
}

// Generate random IP for simulation
function randomIp() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export default function SimulationEngine({ onResult, onLoading }: Props) {
  const [amount, setAmount] = useState("120.00");
  const [time, setTime] = useState("86400");
  const [ipAddress] = useState(randomIp());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    onLoading(true);

    try {
      const result = await predictTransaction({
        amount: parseFloat(amount),
        time: parseFloat(time),
        ipAddress,
      });
      onResult(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? "Prediction failed";
      setError(msg);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  // Randomize a suspicious transaction
  const loadSuspicious = () => {
    setAmount((2000 + Math.random() * 8000).toFixed(2));
    setTime(String(Math.floor(Math.random() * 172800)));
  };

  return (
    <div className="card p-6 h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-black font-headline text-on-surface">
          Simulation Engine
        </h2>
        <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-widest">
          Real-time
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount + Time row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Transaction Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-base pl-12 font-mono-code"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Time Elapsed (seconds)
            </label>
            <input
              type="number"
              min="0"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-base font-mono-code"
            />
          </div>
        </div>

        {/* Origin Metadata */}
        <div className="p-4 bg-neutral rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Origin Metadata
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
              info
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono-code text-on-surface-variant border border-outline-variant/30">
              IP: {ipAddress}
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono-code text-on-surface-variant border border-outline-variant/30">
              TXN_SIM_{Math.abs(Math.floor(parseFloat(amount) * 100) % 99999).toString().padStart(5, "0")}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-danger-light rounded-lg border border-danger/20 animate-fade-in">
            <span className="material-symbols-outlined text-danger text-[16px] mt-0.5">error</span>
            <p className="text-xs text-danger font-medium">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadSuspicious}
            disabled={loading}
            className="flex-shrink-0 px-4 py-3 border border-outline-variant/50 text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-neutral transition-colors disabled:opacity-50"
          >
            🎲 Simulate Fraud
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl
              hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md
              flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Analyzing…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                Run Prediction Analysis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
