import React from "react";

/**
 * PageHeader
 * - title: string
 * - subtitle: string (optional)
 * - meta: ReactNode (optional) -> small line under subtitle
 * - actions: ReactNode (optional) -> right side actions area
 * - variant: "soft" | "plain" (optional) default "soft"
 */
export default function PageHeader({
  title,
  subtitle,
  meta,
  actions,
  variant = "soft",
}) {
  const wrap =
    variant === "plain"
      ? "mt-2"
      : "mt-2 rounded-3xl border border-black/5 bg-gradient-to-br from-cream-100 to-white p-8";

  return (
    <div className={wrap}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-extrabold text-hlblack">{title}</h2>

          {subtitle ? (
            <p className="mt-1 text-sm text-black/60">{subtitle}</p>
          ) : null}

          {meta ? <div className="mt-2 text-xs text-black/60">{meta}</div> : null}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
