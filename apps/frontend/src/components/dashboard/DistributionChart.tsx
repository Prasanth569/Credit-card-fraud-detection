import type { StatsData } from "../../api/predict";

interface Props {
  stats: StatsData | null;
}

export default function DistributionChart({ stats }: Props) {
  const legit = stats?.legit ?? 12266;
  const fraud = stats?.fraud ?? 184;
  const flagged = stats?.flagged ?? 62;
  const total = legit + fraud + flagged || 1;

  const legitPct = (legit / total) * 100;
  const fraudPct = (fraud / total) * 100;

  // SVG donut
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const legitDash = (legitPct / 100) * circ;
  const fraudDash = (fraudPct / 100) * circ;

  // offsets: fraud starts after legit segment

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black font-headline text-on-surface">Distribution</h3>
        <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
          All time
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0 w-[88px] h-[88px]">
          <svg width="88" height="88" className="-rotate-90">
            {/* Track */}
            <circle cx="44" cy="44" r={radius} fill="transparent" stroke="#EBECF0" strokeWidth="12" />
            {/* Legit — primary */}
            <circle
              cx="44" cy="44" r={radius}
              fill="transparent" stroke="#0052CC" strokeWidth="12"
              strokeDasharray={`${legitDash} ${circ - legitDash}`}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
            {/* Fraud — danger */}
            <circle
              cx="44" cy="44" r={radius}
              fill="transparent" stroke="#DE350B" strokeWidth="12"
              strokeDasharray={`${fraudDash} ${circ - fraudDash}`}
              strokeDashoffset={-legitDash}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black font-headline text-on-surface">
              {legitPct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 flex-1">
          {[
            { label: "Legit", color: "bg-primary", count: legit.toLocaleString() },
            { label: "Fraud", color: "bg-danger", count: fraud.toLocaleString() },
            { label: "Flagged", color: "bg-warning", count: flagged.toLocaleString() },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-on-surface-variant font-medium">{label}</span>
              </div>
              <span className="font-bold text-on-surface font-mono-code">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
