import { useEffect, useState } from "react";
import type { PredictionResult } from "../../api/predict";
import { ENUMS } from "@enums/index";

interface Props {
  result: PredictionResult | null;
  loading: boolean;
}

function ProbabilityRing({ probability }: { probability: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 1) * circumference;
  const color =
    probability > 0.7 ? "#DE350B" : probability > 0.3 ? "#FF991F" : "#00875A";

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle
        cx="50" cy="50" r={radius}
        fill="transparent" stroke="#EBECF0" strokeWidth="10"
      />
      <circle
        cx="50" cy="50" r={radius}
        fill="transparent" stroke={color} strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
      />
    </svg>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { cls: string; icon: string }> = {
    [ENUMS.Common.Decision.ALLOW]: { cls: "bg-success-light text-success border-success/30", icon: "check_circle" },
    [ENUMS.Common.Decision.FLAG]: { cls: "bg-warning-light text-warning border-warning/30", icon: "warning" },
    [ENUMS.Common.Decision.BLOCK]: { cls: "bg-danger-light text-danger border-danger/30", icon: "block" },
  };
  const { cls, icon } = map[decision] ?? map[ENUMS.Common.Decision.FLAG];
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-black uppercase tracking-widest ${cls}`}>
      <span className="material-symbols-outlined text-[16px]"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24" }}>
        {icon}
      </span>
      {decision}
    </span>
  );
}

export default function AnalysisResult({ result, loading }: Props) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    if (result) {
      setAnimatedProb(0);
      const target = Number.isFinite(result.probability) ? result.probability : 0;
      const duration = 800;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        setAnimatedProb(target * ease);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [result]);

  const probColor =
    animatedProb > 0.7 ? "text-danger" : animatedProb > 0.3 ? "text-warning" : "text-success";

  const riskLabel = animatedProb > 0.9
    ? "Critical"
    : animatedProb > 0.7
    ? "High"
    : animatedProb > 0.3
    ? "Medium"
    : "Low";

  // Loading skeleton
  if (loading) {
    return (
      <div className="card p-6 h-full flex flex-col gap-6 animate-pulse">
        <div className="h-4 bg-neutral-dark rounded w-32" />
        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-full bg-neutral-dark" />
          <div className="space-y-2 flex-1">
            <div className="h-10 bg-neutral-dark rounded w-3/4" />
            <div className="h-4 bg-neutral-dark rounded w-1/4" />
          </div>
        </div>
        <div className="h-px bg-neutral-dark" />
        <div className="h-10 bg-neutral-dark rounded-full w-2/3" />
        <div className="h-16 bg-neutral-dark rounded-xl" />
      </div>
    );
  }

  // Empty state
  if (!result) {
    return (
      <div className="card p-6 h-full flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">radar</span>
        </div>
        <div>
          <h3 className="font-bold font-headline text-on-surface mb-1">
            Awaiting Analysis
          </h3>
          <p className="text-sm text-on-surface-variant">
            Fill in the Simulation Engine and click <strong>Run Prediction Analysis</strong> to see results here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 h-full flex flex-col gap-5 animate-fade-in relative overflow-hidden">
      {/* Background glow for danger */}
      {result.decision === ENUMS.Common.Decision.BLOCK && (
        <div className="absolute inset-0 bg-gradient-to-br from-danger/5 to-transparent pointer-events-none" />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Analysis Result
        </p>
        <span className="text-[10px] font-mono-code text-on-surface-variant/70">
          {result.txnId}
        </span>
      </div>

      {/* Probability */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ProbabilityRing probability={animatedProb} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black font-headline text-on-surface">
              {(animatedProb * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant font-medium mb-1">Fraud Probability</p>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-black font-headline ${probColor} transition-colors`}>
              {(animatedProb * 100).toFixed(1)}%
            </span>
            <span className={`text-sm font-bold mb-1 ${probColor}`}>{riskLabel}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-outline-variant/30" />

      {/* Decision + Latency */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-on-surface-variant font-medium mb-1.5">Final Decision</p>
          <DecisionBadge decision={result.decision} />
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-medium mb-1">Latency</p>
          <p className="font-mono-code text-sm font-bold text-on-surface">
            {result.latencyMs?.toFixed(1) ?? "—"}ms
          </p>
        </div>
      </div>

      {/* Model version + model used */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[10px] text-on-surface-variant font-mono-code">
            {result.modelVersion || "unknown-model"}
          </span>
        </div>
        {result.modelUsed && (() => {
          const map: Record<string, { label: string; cls: string }> = {
            aht:    { label: "AHT",         cls: "bg-[#E3FCEF] text-[#00875A]" },
            rnn:    { label: "RNN · LSTM",  cls: "bg-[#EAE6FF] text-[#5243AA]" },
            hybrid: { label: "AHT+RNN ✦",  cls: "bg-[#E6F2FF] text-[#0052CC]" },
          };
          const { label, cls } = map[result.modelUsed] ?? map["hybrid"];
          return (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${cls}`}>
              {label}
            </span>
          );
        })()}
      </div>

      {/* Flags */}
      {result.flags && result.flags.length > 0 && (
        <div className="p-3 bg-danger/5 rounded-xl border border-danger/15 animate-fade-in">
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-danger text-[16px] mt-0.5 flex-shrink-0">
              warning
            </span>
            <div>
              <p className="text-xs font-bold text-danger mb-1">System Flags</p>
              <ul className="space-y-0.5">
                {result.flags.map((flag) => (
                  <li key={flag} className="text-[11px] text-on-error-container font-mono-code leading-relaxed">
                    • {flag.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
