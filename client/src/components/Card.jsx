import { cn } from "./cn";

export function Card({ className = "", children }) {
  return (
    <div className={cn("rounded-2xl border border-black/10 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return (
    <div className={cn("px-5 py-4 border-b border-black/10", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return (
    <div className={cn("px-5 py-4 border-t border-black/10", className)}>
      {children}
    </div>
  );
}
