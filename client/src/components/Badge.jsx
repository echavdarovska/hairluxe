import { cn } from "./cn";

export default function Badge({ tone = "gray", className = "", children }) {
  const tones = {
    gray: "bg-black/5 text-black",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-900",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone] || tones.gray,
        className
      )}
    >
      {children}
    </span>
  );
}
