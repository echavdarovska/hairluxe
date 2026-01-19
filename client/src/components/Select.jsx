import React from "react";
import { cn } from "./cn";

export default function Select({
  label,
  error,
  hint,
  className = "",
  selectClassName = "",
  options, 
  children,
  ...props
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-black/80">
          {label}
        </label>
      )}

      <select
        className={cn(
          "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none transition",
          "focus:ring-2 focus:ring-hlgreen-600/30",
          "disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/50",
          error && "border-red-500 focus:ring-red-500/30",
          selectClassName
        )}
        {...props}
      >
        {Array.isArray(options) && options.length > 0
          ? options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-black/55">{hint}</p>
      ) : null}
    </div>
  );
}
