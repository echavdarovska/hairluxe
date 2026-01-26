import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Scissors,
  Users,
  Timer,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const location = useLocation();

  const NAV = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
      { to: "/admin/schedule", label: "Schedule", icon: Clock },
      { to: "/admin/services", label: "Services", icon: Scissors },
      { to: "/admin/staff", label: "Staff", icon: Users },
      { to: "/admin/working-hours", label: "Working hours", icon: Timer },
    ],
    []
  );

  const activeLabel = useMemo(() => {
    const cur = NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    );
    return cur?.label || "Admin";
  }, [NAV, location.pathname]);

  const linkBase =
    "group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition";
  const linkIdle = "text-black/70 hover:bg-black/5";
  const linkActive = "bg-black text-white shadow-sm";

  return (
    <div className="w-full  flex justify-center ">
      {/* 🔒 HARD 80vw CONTAINER */}
      <div className="min-w-[80vw] py-6">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
            {/* Sidebar header */}
            <div className="mb-4 rounded-2xl border border-black/5 bg-gradient-to-br from-cream-100 to-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-black/50">
                HairLuxe Admin
              </div>
              <div className="mt-1 text-lg font-extrabold text-hlblack">
                {activeLabel}
              </div>
              <div className="mt-1 text-xs text-black/60">
                Operations & configuration
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={!!n.end}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkIdle}`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 opacity-90" />
                      {n.label}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-70" />
                  </NavLink>
                );
              })}
            </nav>


           
          </aside>

          {/* Main content */}
          <section className="w-full">
            <div className="rounded-3xl border border-black/5 bg-white p-5">
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
