import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-[#e6d5c5] bg-[#faf5f0] text-[#5c493e]",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-700",
  accent: "border-[#d8b89c] bg-[#f6ece3] text-[#3d2e24]",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function KpiStatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "warning";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-[0_2px_12px_rgba(61,46,36,0.04)] transition-colors",
        tone === "accent"
          ? "border-[#d8b89c] bg-gradient-to-br from-white to-[#faf5f0]"
          : tone === "warning"
            ? "border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40"
            : "border-[#e6d5c5]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#6e5a4f]">{label}</span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6ece3] text-[#3d2e24]">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-[#1e1b18]">{value}</div>
      {hint && <p className="mt-1 text-[11px] text-[#7c685c]">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#e6d5c5] bg-white shadow-[0_2px_14px_rgba(61,46,36,0.04)]",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efe2d4] bg-[#faf5f0]/60 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-[#3d2e24]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-[#6e5a4f]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9c5b2] bg-[#faf5f0]/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6ece3] text-[#9e7656]">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#3d2e24]">{title}</h3>
      {description && <p className="mt-1 max-w-md text-xs leading-relaxed text-[#6e5a4f]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PortalPageHeader({
  title,
  badge,
  actions,
}: {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#3d2e24] sm:text-3xl">
          {title}
        </h1>
        {badge}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
