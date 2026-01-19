import React from "react";
import { NavLink } from "react-router-dom";

export default function AdminLayout({ children }) {
  const link = (to, label) => (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/5 ${
          isActive ? "bg-black/5" : ""
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="w-full flex justify-center">
      {/* 80vw admin shell */}
      <div className="w-full min-w-[80vw]">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm h-fit">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/50">
              Admin
            </div>
            {link("/admin", "Dashboard")}
            {link("/admin/services", "Services")}
            {link("/admin/staff", "Staff")}
            {link("/admin/working-hours", "Working Hours")}
            {link("/admin/schedule", "Schedule")}
            {link("/admin/appointments", "Appointments")}
            {link("/admin/settings", "Settings")}
          </aside>

          {/* Main content */}
          <section className="w-full">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
