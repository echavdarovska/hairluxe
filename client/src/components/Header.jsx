import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import { useAuth } from "../state/auth";
import api from "../lib/api";

export default function Header() {
  const { user, logout } = useAuth();
  const isAdmin = !!user && user.role === "admin";

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => setOpen(false), [location.pathname]);

  // Load unread notifications count when logged in
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    api
      .get("/notifications")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => setUnreadCount(0));
  }, [user]);

  // Container width strategy:
  // - Mobile: full width (best UX)
  // - md+: exact 80vw (matches your admin shell)
  const containerClass =
    "mx-auto w-full px-4 sm:px-6 md:w-[80vw] md:max-w-[80vw] md:min-w-[80vw]";

  const headerItemClass = ({ isActive }) =>
    `relative inline-flex items-center px-2 py-1 text-sm font-medium transition
     focus:outline-none focus-visible:ring-2 focus-visible:ring-hlgreen-300 focus-visible:ring-offset-2
     ${
       isActive
         ? "text-hlgreen-700 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-hlgreen-600"
         : "text-hlblack hover:text-hlgreen-600"
     }`;

  const mobileItemClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition
     focus:outline-none focus-visible:ring-2 focus-visible:ring-hlgreen-300 focus-visible:ring-offset-2
     ${isActive ? "bg-hlgreen-50 text-hlgreen-800" : "text-hlblack hover:bg-black/5"}`;

  const authLinks = useMemo(() => {
    if (!user) {
      return {
        desktop: (
          <>
            <Link to="/login">
              <Button variant="soft" size="sm" className="rounded-md">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="rounded-md">
                Register
              </Button>
            </Link>
          </>
        ),
        mobile: (
          <>
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="soft" size="md" className="w-full rounded-md justify-center">
                Login
              </Button>
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button variant="primary" size="md" className="w-full rounded-md justify-center">
                Register
              </Button>
            </Link>
          </>
        ),
      };
    }

    return {
      desktop: (
        <>
          {isAdmin && (
            <Link to="/admin" title="Admin Dashboard">
              <Button variant="chip" size="sm" className="rounded-md">
                Dashboard
              </Button>
            </Link>
          )}

          <Button
            variant="soft"
            size="sm"
            className="rounded-md"
            onClick={logout}
          >
            Logout
          </Button>
        </>
      ),
      mobile: (
        <>
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              <Button variant="chip" size="md" className="w-full rounded-md justify-center">
                Dashboard
              </Button>
            </Link>
          )}

          <Button
            variant="soft"
            size="md"
            className="w-full rounded-md justify-center"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Logout
          </Button>
        </>
      ),
    };
  }, [user, isAdmin, logout]);

  return (
    <header className="border-b bg-white w-full">
      {/* Top bar */}
      <div className={`${containerClass} flex items-center justify-between py-4`}>
        {/* Logo */}
        <Link to="/" className="text-xl font-semibold text-hlblack">
          Hair<span className="text-hlgreen-600">Luxe</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {/* Public-ish links: show only when logged in (your app requires auth for book/appointments anyway) */}
          {user && (
            <>
              <NavLink to="/services" className={headerItemClass}>
                Services
              </NavLink>
              <NavLink to="/book" className={headerItemClass}>
                Book
              </NavLink>
              <NavLink to="/appointments" className={headerItemClass}>
                My Appointments
              </NavLink>

              <NavLink to="/notifications" className={headerItemClass} title="Notifications">
                <span className="inline-flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            </>
          )}

          {/* Auth-dependent actions */}
          {authLinks.desktop}
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Notifications icon only when logged in */}
          {user && (
            <Link
              to="/notifications"
              className="relative rounded-md px-2 py-2"
              title="Notifications"
              onClick={() => setOpen(false)}
            >
              <span className="text-sm text-hlblack">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border px-3 py-2 text-sm font-semibold text-hlblack"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="md:hidden border-t bg-white">
          <div className={`${containerClass} py-3 flex flex-col gap-2`}>
            {user ? (
              <>
                <NavLink to="/services" onClick={() => setOpen(false)} className={mobileItemClass}>
                  Services
                </NavLink>
                <NavLink to="/book" onClick={() => setOpen(false)} className={mobileItemClass}>
                  Book
                </NavLink>
                <NavLink to="/appointments" onClick={() => setOpen(false)} className={mobileItemClass}>
                  My Appointments
                </NavLink>
                <NavLink to="/notifications" onClick={() => setOpen(false)} className={mobileItemClass}>
                  <span className="inline-flex items-center justify-between w-full">
                    Notifications
                    {unreadCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </span>
                </NavLink>

                <div className="pt-2">{authLinks.mobile}</div>
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
