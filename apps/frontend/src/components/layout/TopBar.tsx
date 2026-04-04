import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const [search, setSearch] = useState("");
  const [hasNotif, setHasNotif] = useState(true);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-14 z-20 bg-white/90 glass border-b border-outline-variant/30 flex items-center px-6 gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search transactions, alerts… (Ctrl+K)"
            className="w-full bg-neutral border border-transparent rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-3 ml-auto">
        {/* Model version badge */}
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary-light rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          CLN-ARCH-v1.0.42
        </span>

        <div className="h-5 w-px bg-outline-variant/40" />

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-neutral transition-colors"
          onClick={() => setHasNotif(false)}
          title="Notifications"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            notifications
          </span>
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
          )}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-[11px] font-headline">AR</span>
          </div>
          <span className="hidden sm:block text-sm font-semibold text-on-surface font-headline">
            Alex Rivera
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
            expand_more
          </span>
        </div>
      </div>
    </header>
  );
}
