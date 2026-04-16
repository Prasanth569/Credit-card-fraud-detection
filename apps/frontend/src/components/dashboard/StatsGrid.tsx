import { useEffect, useState } from "react";
import type { StatsData } from "../../api/predict";

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  badge: string;
  badgeColor: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeColor, trend }: StatCardProps) {
  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200 animate-fade-in group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={`material-symbols-outlined text-[20px] ${iconColor}`}
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}>
            {icon}
          </span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeColor} flex items-center gap-1`}>
          {trend === "up" && "↑"}
          {trend === "down" && "↓"}
          {badge}
        </span>
      </div>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">
        {label}
      </p>
      <h3 className="text-2xl font-black font-headline text-on-surface group-hover:text-primary transition-colors">
        {value}
      </h3>
    </div>
  );
}

interface Props {
  stats: StatsData | null;
  loading: boolean;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-IN");
}

export default function StatsGrid({ stats, loading }: Props) {
  const [displayed, setDisplayed] = useState<StatsData | null>(null);

  useEffect(() => {
    if (stats) setDisplayed(stats);
  }, [stats]);

  const s = displayed ?? { total: 0, fraud: 0, legit: 0, flagged: 0, fraudRate: 0 };

  const cards: StatCardProps[] = [
    {
      icon: "payments",
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
      label: "Total Transactions",
      value: loading ? "---" : formatNumber(s.total),
      badge: "+4.2%",
      badgeColor: "bg-success-light text-success",
      trend: "up",
    },
    {
      icon: "gpp_bad",
      iconBg: "bg-danger-light",
      iconColor: "text-danger",
      label: "Fraud Detected",
      value: loading ? "---" : formatNumber(s.fraud),
      badge: s.fraud > 0 ? `+${((s.fraud / Math.max(s.total, 1)) * 100).toFixed(1)}%` : "0%",
      badgeColor: "bg-danger-light text-danger",
      trend: "up",
    },
    {
      icon: "verified",
      iconBg: "bg-success-light",
      iconColor: "text-success",
      label: "Legit Transactions",
      value: loading ? "---" : formatNumber(s.legit),
      badge: s.total > 0 ? `${(((s.legit) / s.total) * 100).toFixed(1)}%` : "100%",
      badgeColor: "bg-primary-light text-primary",
      trend: "neutral",
    },
    {
      icon: "percent",
      iconBg: "bg-warning-light",
      iconColor: "text-warning",
      label: "Fraud Rate",
      value: loading ? "---" : `${s.fraudRate}%`,
      badge: "-0.4%",
      badgeColor: "bg-success-light text-success",
      trend: "down",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  );
}
