import { useState, useEffect } from "react";
import { getThresholds, updateThresholds } from "../api/predict";

export default function Settings() {
  const [flagThreshold, setFlagThreshold] = useState(0.3);
  const [blockThreshold, setBlockThreshold] = useState(0.7);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThresholds()
      .then((t) => {
        setFlagThreshold(t.flagThreshold);
        setBlockThreshold(t.blockThreshold);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateThresholds(flagThreshold, blockThreshold);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to update thresholds");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setFlagThreshold(0.3);
    setBlockThreshold(0.7);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-dark rounded w-40 animate-pulse" />
        <div className="card h-64 animate-pulse bg-neutral/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-headline text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Configure the Decision Engine thresholds and system parameters
        </p>
      </div>

      {/* Decision Engine Thresholds */}
      <div className="card p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-light">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
            >
              tune
            </span>
          </div>
          <div>
            <h2 className="font-bold font-headline text-on-surface">Decision Engine Thresholds</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Adjust the fraud probability thresholds used by the Decision Engine
            </p>
          </div>
        </div>

        {/* Visual threshold bar */}
        <div className="space-y-3">
          <div className="relative h-10 rounded-xl overflow-hidden bg-neutral flex">
            <div
              className="bg-success-light flex items-center justify-center text-[10px] font-bold text-success"
              style={{ width: `${flagThreshold * 100}%` }}
            >
              ALLOW
            </div>
            <div
              className="bg-warning-light flex items-center justify-center text-[10px] font-bold text-warning"
              style={{ width: `${(blockThreshold - flagThreshold) * 100}%` }}
            >
              FLAG
            </div>
            <div
              className="bg-danger-light flex items-center justify-center text-[10px] font-bold text-danger"
              style={{ width: `${(1 - blockThreshold) * 100}%` }}
            >
              BLOCK
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono-code">
            <span>0.0</span>
            <span>{flagThreshold}</span>
            <span>{blockThreshold}</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Flag Threshold
              </span>
              <span className="text-sm font-black font-headline text-warning">
                {flagThreshold.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min={0.05}
              max={blockThreshold - 0.05}
              step={0.05}
              value={flagThreshold}
              onChange={(e) => setFlagThreshold(parseFloat(e.target.value))}
              className="w-full accent-warning h-2 rounded-full cursor-pointer"
            />
            <p className="text-[10px] text-on-surface-variant">
              Transactions with probability above this value will be flagged for review
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Block Threshold
              </span>
              <span className="text-sm font-black font-headline text-danger">
                {blockThreshold.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min={flagThreshold + 0.05}
              max={0.95}
              step={0.05}
              value={blockThreshold}
              onChange={(e) => setBlockThreshold(parseFloat(e.target.value))}
              className="w-full accent-danger h-2 rounded-full cursor-pointer"
            />
            <p className="text-[10px] text-on-surface-variant">
              Transactions with probability above this value will be automatically blocked
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-light rounded-lg border border-danger/20 animate-fade-in">
            <span className="material-symbols-outlined text-danger text-[16px]">error</span>
            <p className="text-xs text-danger font-medium">{error}</p>
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-success-light rounded-lg border border-success/20 animate-fade-in">
            <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
            <p className="text-xs text-success font-medium">Thresholds saved successfully!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={resetDefaults}
            className="text-sm text-on-surface-variant font-semibold hover:text-on-surface transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark
              transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Save Thresholds
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-neutral">
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
          </div>
          <h2 className="font-bold font-headline text-on-surface">System Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Model Version", value: "CLN-ARCH-v1.0.42" },
            { label: "Architecture", value: "DWM + AHT Ensemble" },
            { label: "Base Learners", value: "10 × Adaptive Hoeffding Tree" },
            { label: "Dataset", value: "Credit Card Fraud (Kaggle)" },
            { label: "Features", value: "30 (Time, Amount, V1–V28)" },
            { label: "Backend", value: "Fastify 5.x + MongoDB Atlas" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {label}
              </span>
              <span className="text-sm font-medium font-mono-code text-on-surface">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
