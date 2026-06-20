import clsx from "clsx";

export function Card({ children, className, glass }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border transition-all",
        glass
          ? "bg-white/60 backdrop-blur-sm border-white/40 shadow-lg"
          : "bg-white border-slate-100 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx("px-6 py-4 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={clsx("px-6 py-4", className)}>{children}</div>;
}
