import React from "react";
import { cn } from "./cn";

export default function InputField({
  label,
  hint,
  error,
  state = "default", // default | error | success
  variant = "default", // default | soft
  leftIcon,
  rightIcon,
  className = "",
  inputClassName = "",
  ...props
}) {
  const states = {
    default: "border-black/15 focus:ring-hlgreen-600/30",
    error: "border-red-500 focus:ring-red-500/30",
    success: "border-green-500 focus:ring-green-500/30",
  };

  const variants = {
    default: "bg-white",
    soft: "bg-black/5",
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-black/80">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">
            {leftIcon}
          </span>
        )}

        <input
          className={cn(
            "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2",
            variants[variant],
            states[state],
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            inputClassName
          )}
          {...props}
        />

        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/50">
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-black/55">{hint}</p>
      ) : null}
    </div>
  );
}
