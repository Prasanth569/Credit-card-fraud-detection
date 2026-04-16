import { useEffect, useState } from "react";

export default function StatusBar() {
  const [tick, setTick] = useState(0);
  const [streamActive, setStreamActive] = useState(true);

  // Simulate stream activity
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setStreamActive((a) => (Math.random() > 0.05 ? true : !a)); // 95% uptime
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour12: false });

  return (
    <footer
      className="fixed bottom-0 left-64 right-0 h-8 z-20 glass border-t border-outline-variant/30
        bg-white/80 flex items-center justify-between px-6 text-[10px] font-bold
        text-on-surface-variant uppercase tracking-widest select-none"
    >
      <div className="flex items-center gap-5">
        {/* Engine status */}
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Engine: Nominal
        </span>

        {/* Stream */}
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              streamActive ? "bg-primary animate-pulse" : "bg-warning"
            }`}
          />
          {streamActive ? "Analyzing Stream…" : "Stream Paused"}
        </span>

        {/* Live transaction counter */}
        <span className="hidden sm:flex items-center gap-1.5 text-on-surface-variant/70">
          Processed: {(12450 + tick * 2).toLocaleString("en-IN")} txns
        </span>
      </div>

      <div className="flex items-center gap-5">
        <span className="text-on-surface-variant/70">{timeStr} UTC</span>
        <span>Model: CLN-ARCH-v1.0.42</span>
      </div>
    </footer>
  );
}
