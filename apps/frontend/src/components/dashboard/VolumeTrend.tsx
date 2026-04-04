import type { StatsData } from "../../api/predict";

interface Props {
  stats: StatsData | null;
}

export default function VolumeTrend({ stats }: Props) {
  const trend = stats?.hourlyTrend ?? [];
  const maxCount = Math.max(...trend.map((t) => t.count), 1);

  // Fallback demo data
  const data =
    trend.length > 0
      ? trend
      : [
          { label: "08:00", count: 120 },
          { label: "09:00", count: 200 },
          { label: "10:00", count: 340 },
          { label: "11:00", count: 280 },
          { label: "12:00", count: 450 },
          { label: "13:00", count: 380 },
          { label: "14:00", count: 220 },
          { label: "15:00", count: 310 },
        ];

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black font-headline text-on-surface">Volume Trend</h3>
        <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
          Last 8h
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => {
          const heightPct = (d.count / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${d.label}: ${d.count} txns`}
            >
              <div className="w-full relative flex items-end" style={{ height: "100px" }}>
                <div
                  className="w-full rounded-t-sm bg-primary-light group-hover:bg-primary transition-colors duration-200"
                  style={{
                    height: `${heightPct}%`,
                    transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data
          .filter((_, i) => i % 2 === 0)
          .map((d) => (
            <span
              key={d.label}
              className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider"
            >
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}
