import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bell,
  CalendarCheck2,
  Scissors,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

import Button from "./Button";
import { useAuth } from "../state/auth";
import api from "../lib/api";

const LOGO_SRC = "/logo2.png";

function isUnread(n) {
  const isReadRaw = n?.isRead ?? n?.is_read;
  const hasReadAt = !!(n?.readAt ?? n?.read_at);

  if (hasReadAt) return false;

  if (typeof isReadRaw === "boolean") return !isReadRaw;
  if (typeof isReadRaw === "number") return isReadRaw === 0;
  if (typeof isReadRaw === "string")
    return isReadRaw === "0" || isReadRaw.toLowerCase() === "false";

  return true;
}

function DesktopNavItem({ to, label, icon: Icon, badge, dot }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-hlgreen-300 focus-visible:ring-offset-2",
          isActive
            ? "bg-cream-100 text-hlgreen-800"
            : "text-hlblack hover:bg-black/5 hover:text-hlgreen-700",
        ].join(" ")
      }
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span className="relative">
        {label}
        {dot ? (
          <span className="absolute -right-2 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        ) : null}
      </span>

      {badge ? (
        <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function MobileNavItem({ to, label, icon: Icon, onClick, badge, dot }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-hlgreen-300 focus-visible:ring-offset-2",
          isActive ? "bg-cream-100 text-hlgreen-800" : "text-hlblack hover:bg-black/5",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center gap-3">
        {Icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <Icon className="h-5 w-5 text-hlgreen-700" />
          </span>
        ) : null}
        <span className="relative">
          {label}
          {dot ? (
            <span className="absolute -right-2 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          ) : null}
        </span>
      </span>

      {badge ? (
        <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-red-600 px-2 text-[12px] font-extrabold text-white">
          {badge}
        </span>
      ) : (
        <span className="text-black/30">→</span>
      )}
    </NavLink>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const isAdmin = !!user && user.role === "admin";

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const fetchUnread = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    api
      .get("/notifications")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.notifications ?? res.data?.items ?? [];
        setUnreadCount(list.filter(isUnread).length);
      })
      .catch(() => setUnreadCount(0));
  }, [user]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    const onUpdated = () => fetchUnread();
    window.addEventListener("notifications:updated", onUpdated);
    return () => window.removeEventListener("notifications:updated", onUpdated);
  }, [fetchUnread]);

  const hasUnread = unreadCount > 0;
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  const containerClass =
    "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  const authLinks = useMemo(() => {
    if (!user) {
      return {
        desktop: (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="soft" size="sm" className="rounded-xl">
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Login
                </span>
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="rounded-xl">
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Register
                </span>
              </Button>
            </Link>
          </div>
        ),
        mobile: (
          <div className="grid gap-2 pt-2">
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button
                variant="soft"
                size="md"
                className="w-full rounded-2xl justify-center"
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-5 w-5" /> Login
                </span>
              </Button>
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button
                variant="primary"
                size="md"
                className="w-full rounded-2xl justify-center"
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Register
                </span>
              </Button>
            </Link>
          </div>
        ),
      };
    }

    return {
      desktop: (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" title="Admin Dashboard">
              <Button variant="chip" size="sm" className="rounded-xl">
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </span>
              </Button>
            </Link>
          )}

          <Button
            variant="soft"
            size="sm"
            className="rounded-xl"
            onClick={logout}
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </span>
          </Button>
        </div>
      ),
      mobile: (
        <div className="grid gap-2 pt-2">
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              <Button
                variant="chip"
                size="md"
                className="w-full rounded-2xl justify-center"
              >
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" /> Dashboard
                </span>
              </Button>
            </Link>
          )}

          <Button
            variant="soft"
            size="md"
            className="w-full rounded-2xl justify-center"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Logout
            </span>
          </Button>
        </div>
      ),
    };
  }, [user, isAdmin, logout]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/85 backdrop-blur">
      {/* Top bar */}
      <div className={`${containerClass} flex items-center justify-between py-3`}>
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-3 min-w-0">
          <img
            src={LOGO_SRC}
            alt="HairLuxe"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div className="leading-tight min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-hlblack leading-none truncate">
                Hair
              </span>
              <span className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-hlgreen-600 leading-none">
                Luxe
              </span>
            </div>

            <div className="mt-0.5 hidden sm:block text-[11px] font-medium text-black/50">
              Book • Confirm • Glow
            </div>
          </div>
        </Link>

        {/* Desktop nav (now starts at lg, so hamburger appears earlier) */}
        <nav className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <DesktopNavItem to="/services" label="Services" icon={Scissors} />
              <DesktopNavItem to="/book" label="Book" icon={Sparkles} />
              <DesktopNavItem
                to="/appointments"
                label="My Appointments"
                icon={CalendarCheck2}
              />
              <DesktopNavItem
                to="/notifications"
                label="Notifications"
                icon={Bell}
                dot={hasUnread}
                badge={hasUnread ? badgeText : null}
              />
            </>
          ) : null}

          <div className="ml-2">{authLinks.desktop}</div>
        </nav>

        {/* Mobile controls (now visible until lg) */}
        <div className="flex items-center gap-2 lg:hidden">
          {user ? (
            <Link
              to="/notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm"
              title="Notifications"
              onClick={() => setOpen(false)}
            >
              <Bell className="h-5 w-5 text-hlblack" />
              {hasUnread ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-hlblack shadow-sm"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="hidden sm:inline">{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile / tablet menu (runs until lg) */}
      {open ? (
        <div className="lg:hidden border-t border-black/5 bg-white">
          <div className={`${containerClass} py-4`}>
            {user ? (
              <>
                <div className="grid gap-2">
                  <MobileNavItem
                    to="/services"
                    label="Services"
                    icon={Scissors}
                    onClick={() => setOpen(false)}
                  />
                  <MobileNavItem
                    to="/book"
                    label="Book"
                    icon={Sparkles}
                    onClick={() => setOpen(false)}
                  />
                  <MobileNavItem
                    to="/appointments"
                    label="My Appointments"
                    icon={CalendarCheck2}
                    onClick={() => setOpen(false)}
                  />
                  <MobileNavItem
                    to="/notifications"
                    label="Notifications"
                    icon={Bell}
                    onClick={() => setOpen(false)}
                    dot={hasUnread}
                    badge={hasUnread ? badgeText : null}
                  />
                </div>

                {authLinks.mobile}
              </>
            ) : (
              authLinks.mobile
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
