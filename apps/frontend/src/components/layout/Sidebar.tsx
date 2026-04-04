import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", icon: "dashboard", label: "Dashboard" },
  { path: "/transactions", icon: "list_alt", label: "Transactions" },
  { path: "/analytics", icon: "insights", label: "Analytics" },
  { path: "/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white border-r border-outline-variant/40 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm">security</span>
          </div>
          <div>
            <h1 className="text-sm font-black font-headline text-on-surface leading-tight">
              Fraud Detection
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium tracking-wider uppercase">
              CLN-ARCH v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ path, icon, label }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
                transition-all duration-150 group
                ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-on-surface-variant hover:bg-neutral hover:text-on-surface"
                }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-all
                  ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}`}
                style={{
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                {icon}
              </span>
              <span className="font-headline">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm font-headline">AR</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface font-headline truncate">Alex Rivera</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
              Lead Architect
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            more_vert
          </span>
        </div>
      </div>
    </aside>
  );
}
