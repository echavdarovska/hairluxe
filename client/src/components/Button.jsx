import React from "react";
import { cn } from "./cn";

export default function Button({
  variant = "primary", // primary | secondary | outline | ghost | danger | warning | soft | nav | chip
  size = "md", // sm | md | lg
  loading = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-hlgreen-600/30 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-hlgreen-600 text-white hover:bg-hlgreen-700",
    secondary: "bg-black text-white hover:bg-black/85",
    outline: "bg-white text-black border border-black/15 hover:bg-black/5",
    ghost: "bg-transparent text-black hover:bg-black/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-amber-500 text-black hover:bg-amber-600",

    // NEW: soft CTA (Login/Logout)
    soft: "bg-hlgreen-50/70 text-hlgreen-800 hover:bg-hlgreen-100/80",

    // NEW: nav-like button (for header actions, not links)
    nav: "bg-transparent text-hlblack hover:text-hlgreen-600 hover:bg-hlgreen-50/60 rounded-md",

    // NEW: subtle admin chip
    chip: "bg-black/5 text-black hover:bg-black/10 rounded-md",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
