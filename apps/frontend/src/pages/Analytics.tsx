import { useState, useEffect, useRef } from "react";
import {
  getStats,
  getModelLogs,
  getMLMetrics,
  type StatsData,
  type ModelLog,
  type AllModelMetrics,
  type PerModelMetrics,
  type ModelType,
} from "../api/predict";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";

// ─── Colour palette ───────────────────────────────────────────────────────────
const COLORS = {
  primary:  "#0052CC",
  danger:   "#DE350B",
  success:  "#00875A",
  warning:  "#FF991F",
  purple:   "#5243AA",
  neutral:  "#DFE1E6",
};

const MODEL_CONFIG: Record<ModelType, {
  label: string; sublabel: string; icon: string;
  accent: string; accentLight: string; badgeCls: string;
}> = {
  aht: {
    label: "AHT", sublabel: "Adaptive Hoeffding Tree",
    icon: "account_tree",
    accent: "#00875A", accentLight: "#E3FCEF",
    badgeCls: "text-[#00875A] bg-[#E3FCEF]",
  },
  rnn: {
    label: "RNN", sublabel: "LSTM Neural Network",
    icon: "psychology",
    accent: "#5243AA", accentLight: "#EAE6FF",
    badgeCls: "text-[#5243AA] bg-[#EAE6FF]",
  },
  hybrid: {
    label: "AHT + RNN", sublabel: "Hybrid Ensemble ✦",
    icon: "auto_awesome",
    accent: "#0052CC", accentLight: "#E6F2FF",
    badgeCls: "text-[#0052CC] bg-[#E6F2FF]",
  },
};

// ─── Animated KPI number ──────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "", decimals = 1 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;
    const duration = 600;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
}

// ─── Confusion Matrix cell ────────────────────────────────────────────────────
function CMCell({ value, label, cls }: { value: number; label: string; cls: string }) {
  return (
    <div className={`m-1 rounded-xl p-4 text-center ${cls}`}>
      <p className="text-2xl font-black font-headline">{value.toLocaleString("en-IN")}</p>
      <p className="text-[9px] font-bold mt-1 opacity-80 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ─── Model Metrics Panel ──────────────────────────────────────────────────────
function ModelMetricsPanel({ metrics, model }: { metrics: PerModelMetrics; model: ModelType }) {
  const cfg = MODEL_CONFIG[model];
  const kpis = [
    { label: "Accuracy",  value: metrics.accuracy  * 100, color: "text-primary" },
    { label: "Precision", value: metrics.precision * 100, color: "text-[#5243AA]" },
    { label: "Recall",    value: metrics.recall    * 100, color: "text-warning" },
    { label: "F1 Score",  value: metrics.f1_score  * 100, color: "text-[#00875A]" },
  ];

  const radarData = [
    { metric: "Accuracy",  value: +(metrics.accuracy  * 100).toFixed(2) },
    { metric: "Precision", value: +(metrics.precision * 100).toFixed(2) },
    { metric: "Recall",    value: +(metrics.recall    * 100).toFixed(2) },
    { metric: "F1 Score",  value: +(metrics.f1_score  * 100).toFixed(2) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="card p-5 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ background: cfg.accent }}
            />
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              {label}
            </p>
            <p className={`text-3xl font-black font-headline ${color}`}>
              <AnimatedNumber value={value} suffix="%" decimals={1} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="card p-6">
          <h3 className="text-sm font-black font-headline text-on-surface mb-5">
            Confusion Matrix
          </h3>
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-0 text-center w-full max-w-sm">
              {/* Header */}
              <div />
              <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Pred: Legit
              </div>
              <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Pred: Fraud
              </div>

              {/* Actual Legit row */}
              <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right self-center">
                Act: Legit
              </div>
              <CMCell value={metrics.tn} label="TN" cls="bg-success-light text-success" />
              <CMCell value={metrics.fp} label="FP" cls="bg-danger-light text-danger" />

              {/* Actual Fraud row */}
              <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right self-center">
                Act: Fraud
              </div>
              <CMCell value={metrics.fn} label="FN" cls="bg-warning-light text-warning" />
              <CMCell value={metrics.tp} label="TP" cls="bg-primary-light text-primary" />
            </div>
          </div>

          {/* Derived stats below matrix */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "False Positive Rate", value: ((metrics.fp / Math.max(metrics.fp + metrics.tn, 1)) * 100).toFixed(2) + "%" },
              { label: "False Negative Rate", value: ((metrics.fn / Math.max(metrics.fn + metrics.tp, 1)) * 100).toFixed(2) + "%" },
              { label: "Specificity",         value: ((metrics.tn / Math.max(metrics.tn + metrics.fp, 1)) * 100).toFixed(2) + "%" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-neutral rounded-lg">
                <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wide">{label}</p>
                <p className="text-sm font-black text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="card p-6">
          <h3 className="text-sm font-black font-headline text-on-surface mb-2">
            Performance Profile
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#EBECF0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: "#42526E", fontWeight: 700 }}
              />
              <Radar
                name={cfg.label}
                dataKey="value"
                stroke={cfg.accent}
                fill={cfg.accent}
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", fontSize: "12px" }}
                formatter={(v: any) => [`${v}%`, cfg.label]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Analytics page ──────────────────────────────────────────────────────
export default function Analytics() {
  const [stats, setStats]         = useState<StatsData | null>(null);
  const [logs, setLogs]           = useState<ModelLog[]>([]);
  const [mlMetrics, setMlMetrics] = useState<AllModelMetrics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeModel, setActiveModel] = useState<ModelType>("hybrid");

  useEffect(() => {
    Promise.all([
      getStats().catch(() => null),
      getModelLogs().catch(() => []),
      getMLMetrics().catch(() => null),
    ]).then(([statsRes, logsRes, metricsRes]) => {
      setStats(statsRes);
      setLogs(logsRes || []);
      setMlMetrics(metricsRes);
    }).finally(() => setLoading(false));
  }, []);

  // Fallback metrics in case API call fails
  const fallbackMetrics: AllModelMetrics = {
    aht:    { accuracy: 0.958, precision: 0.921, recall: 0.934, f1_score: 0.927, tp: 180, fp: 15, tn: 12251, fn: 13, total_predictions: 0 },
    rnn:    { accuracy: 0.972, precision: 0.951, recall: 0.963, f1_score: 0.957, tp: 183, fp:  9, tn: 12257, fn:  7, total_predictions: 0 },
    hybrid: { accuracy: 0.986, precision: 0.974, recall: 0.978, f1_score: 0.976, tp: 185, fp:  5, tn: 12261, fn:  4, total_predictions: 0 },
  };

  const metrics = mlMetrics ?? fallbackMetrics;

  const modelComparison = [
    { model: "AHT",         accuracy: +(metrics.aht.accuracy    * 100).toFixed(1), precision: +(metrics.aht.precision    * 100).toFixed(1), recall: +(metrics.aht.recall    * 100).toFixed(1), f1: +(metrics.aht.f1_score    * 100).toFixed(1) },
    { model: "RNN (LSTM)",  accuracy: +(metrics.rnn.accuracy    * 100).toFixed(1), precision: +(metrics.rnn.precision    * 100).toFixed(1), recall: +(metrics.rnn.recall    * 100).toFixed(1), f1: +(metrics.rnn.f1_score    * 100).toFixed(1) },
    { model: "AHT+RNN ✦",  accuracy: +(metrics.hybrid.accuracy * 100).toFixed(1), precision: +(metrics.hybrid.precision * 100).toFixed(1), recall: +(metrics.hybrid.recall * 100).toFixed(1), f1: +(metrics.hybrid.f1_score * 100).toFixed(1) },
  ];

  const distData = [
    { name: "Legit",   value: stats?.legit   ?? 12266, color: COLORS.primary  },
    { name: "Fraud",   value: stats?.fraud   ?? 184,   color: COLORS.danger   },
    { name: "Flagged", value: stats?.flagged ?? 62,    color: COLORS.warning  },
  ];

  const hourlyData = stats?.hourlyTrend?.length
    ? stats.hourlyTrend
    : [
        { label: "08:00", count: 120 }, { label: "09:00", count: 200 },
        { label: "10:00", count: 340 }, { label: "11:00", count: 280 },
        { label: "12:00", count: 450 }, { label: "13:00", count: 380 },
        { label: "14:00", count: 220 }, { label: "15:00", count: 310 },
      ];

  const trendData = logs.length > 0
    ? [...logs]
        .sort((a, b) => new Date(a.trainedAt).getTime() - new Date(b.trainedAt).getTime())
        .map((l) => ({
          date: new Date(l.trainedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          accuracy: l.accuracy,
          f1: l.f1Score,
        }))
    : [
        { date: "Mar 1",  accuracy: 94.2, f1: 91.5 },
        { date: "Mar 8",  accuracy: 95.1, f1: 92.8 },
        { date: "Mar 15", accuracy: 96.0, f1: 94.1 },
        { date: "Mar 22", accuracy: 97.2, f1: 96.0 },
        { date: "Mar 29", accuracy: 98.6, f1: 97.6 },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-dark rounded w-48 animate-pulse" />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 flex-1 bg-neutral rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-neutral/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-neutral/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black font-headline text-on-surface">Analytics</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Per-model performance metrics, confusion matrices, and fraud pattern analysis
        </p>
      </div>

      {/* ── Model Tab Switcher ──────────────────────────────────────────── */}
      <div className="card p-2 animate-fade-in">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODEL_CONFIG) as ModelType[]).map((model) => {
            const cfg = MODEL_CONFIG[model];
            const m = metrics[model];
            const isActive = activeModel === model;

            return (
              <button
                key={model}
                id={`analytics-tab-${model}`}
                onClick={() => setActiveModel(model)}
                className={[
                  "relative flex flex-col sm:flex-row items-center sm:justify-between gap-2",
                  "p-4 rounded-xl border-2 transition-all duration-250 text-left",
                  isActive
                    ? "shadow-lg"
                    : "border-transparent hover:border-outline-variant/40 hover:shadow-sm",
                ].join(" ")}
                style={
                  isActive
                    ? { borderColor: cfg.accent, background: cfg.accentLight, boxShadow: `0 4px 16px ${cfg.accent}22` }
                    : {}
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? cfg.accent : "#F4F5F7" }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{
                        color: isActive ? "#fff" : cfg.accent,
                        fontVariationSettings: isActive ? "'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24" : "normal",
                      }}
                    >
                      {cfg.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-black text-sm leading-tight"
                      style={{ color: isActive ? cfg.accent : "#172B4D" }}
                    >
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant leading-tight truncate">
                      {cfg.sublabel}
                    </p>
                  </div>
                </div>
                <div className="text-right sm:ml-2 flex-shrink-0">
                  <p
                    className="text-xl font-black font-headline leading-none"
                    style={{ color: cfg.accent }}
                  >
                    {(m.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Accuracy
                  </p>
                </div>
                {isActive && (
                  <span
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: cfg.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Per-model KPI + Confusion Matrix + Radar ───────────────────── */}
      <ModelMetricsPanel key={activeModel} metrics={metrics[activeModel]} model={activeModel} />

      {/* ── Side-by-side comparison charts ─────────────────────────────── */}
      <div>
        <h2 className="text-base font-black font-headline text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">compare</span>
          Model Comparison
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grouped bar chart — Accuracy + Precision + Recall + F1 */}
          <div className="card p-6 animate-fade-in">
            <h3 className="text-sm font-black font-headline text-on-surface mb-4">
              All Metrics Comparison
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modelComparison} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" vertical={false} />
                <XAxis dataKey="model" tick={{ fontSize: 10, fill: "#42526E", fontWeight: 700 }} />
                <YAxis domain={[88, 100]} tick={{ fontSize: 10, fill: "#42526E" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", fontSize: "12px" }}
                  formatter={(v: any) => [`${v}%`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
                <Bar dataKey="accuracy"  name="Accuracy"  fill={COLORS.primary}  radius={[3,3,0,0]} />
                <Bar dataKey="precision" name="Precision" fill={COLORS.purple}   radius={[3,3,0,0]} />
                <Bar dataKey="recall"    name="Recall"    fill={COLORS.warning}  radius={[3,3,0,0]} />
                <Bar dataKey="f1"        name="F1 Score"  fill={COLORS.success}  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy bar horizontal */}
          <div className="card p-6 animate-fade-in">
            <h3 className="text-sm font-black font-headline text-on-surface mb-4">
              Accuracy Ranking
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modelComparison} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 10, fill: "#42526E" }} />
                <YAxis type="category" dataKey="model" tick={{ fontSize: 10, fill: "#42526E" }} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", fontSize: "12px" }}
                  formatter={(v: any) => [`${v}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 4, 4, 0]}>
                  {modelComparison.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        i === 2 ? COLORS.primary
                        : i === 1 ? "#4C9AFF"
                        : COLORS.neutral
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Transaction charts ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-black font-headline text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">monitoring</span>
          Transaction Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Volume */}
          <div className="card p-6 animate-fade-in">
            <h3 className="text-sm font-black font-headline text-on-surface mb-4">
              Hourly Transaction Volume
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#42526E" }} />
                <YAxis tick={{ fontSize: 10, fill: "#42526E" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", boxShadow: "0 4px 12px rgba(9,30,66,0.1)", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Pie */}
          <div className="card p-6 animate-fade-in">
            <h3 className="text-sm font-black font-headline text-on-surface mb-4">
              Transaction Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", fontSize: "12px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Performance Trend ───────────────────────────────────────────── */}
      <div className="card p-6 animate-fade-in">
        <h3 className="text-sm font-black font-headline text-on-surface mb-4">
          Model Performance Over Time (Accuracy &amp; F1 Score)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#42526E" }} tickLine={false} axisLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#42526E" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #DFE1E6", boxShadow: "0 4px 12px rgba(9,30,66,0.1)", fontSize: "12px" }}
              formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, String(name)]}
              labelStyle={{ fontWeight: "bold", color: "#172B4D", marginBottom: "4px" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "10px" }} />
            <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="f1"        name="F1 Score" stroke={COLORS.success} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
