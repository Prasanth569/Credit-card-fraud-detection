import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAlerts } from "../../contexts/AlertContext";
import NotificationDropdown from "./NotificationDropdown";

export default function TopBar() {
  const [search, setSearch] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useAlerts();

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

  // Click-outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U";
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";

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

      <div className="flex items-center gap-3 ml-auto relative">
        {/* Model version badge */}
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary-light rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          CLN-ARCH-v1.0.42
        </span>

        <div className="h-5 w-px bg-outline-variant/40" />

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-neutral transition-colors"
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
            id="notification-bell"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-danger text-white text-[9px] font-bold rounded-full border-2 border-white animate-fade-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown isOpen={showNotif} onClose={() => setShowNotif(false)} />
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral transition-colors cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-[11px] font-headline">{userInitial}</span>
              </div>
            )}
            <span className="hidden sm:block text-sm font-semibold text-on-surface font-headline">
              {userName}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
              expand_more
            </span>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-outline-variant/40 rounded-lg shadow-lg overflow-hidden py-1 animate-fade-in">
              <div className="px-4 py-2 border-b border-outline-variant/20 mb-1">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Signed in as</p>
                <p className="text-sm text-on-surface font-medium truncate">{currentUser?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
