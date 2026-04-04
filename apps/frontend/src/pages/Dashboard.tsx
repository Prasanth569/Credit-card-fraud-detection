import { useState, useEffect, useCallback } from "react";
import { getStats, type StatsData, type PredictionResult } from "../api/predict";
import StatsGrid from "../components/dashboard/StatsGrid";
import SimulationEngine from "../components/dashboard/SimulationEngine";
import AnalysisResult from "../components/dashboard/AnalysisResult";
import RecentActivity from "../components/dashboard/RecentActivity";
import VolumeTrend from "../components/dashboard/VolumeTrend";
import DistributionChart from "../components/dashboard/DistributionChart";

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      // stats API unavailable — show zeros
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 30s
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const handleResult = (result: PredictionResult) => {
    setPrediction(result);
    // Refresh stats + activity after new prediction
    fetchStats();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-headline text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Real-time fraud detection overview — DWM + AHT Ensemble
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); setRefreshKey((k) => k + 1); }}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant/50 rounded-lg
            text-sm font-semibold text-on-surface-variant hover:bg-neutral transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <StatsGrid stats={stats} loading={statsLoading} />

      {/* Middle: Simulation + Result */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SimulationEngine onResult={handleResult} onLoading={setPredLoading} />
        </div>
        <div className="lg:col-span-5">
          <AnalysisResult result={prediction} loading={predLoading} />
        </div>
      </section>

      {/* Bottom: Activity + Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RecentActivity refreshKey={refreshKey} />
        </div>
        <div className="lg:col-span-4 space-y-5">
          <VolumeTrend stats={stats} />
          <DistributionChart stats={stats} />
        </div>
      </section>
    </div>
  );
}
