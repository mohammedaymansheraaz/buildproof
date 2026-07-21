import type { ReactNode } from "react";
import {
  Accessibility,
  Activity,
  Bot,
  Cloud,
  Code2,
  Database,
  FileSearch,
  Gauge,
  Network,
  Pointer,
  Rocket,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { AuditCategory, FindingStatus, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GlassPanel({
  children,
  className,
  tone = "standard",
}: {
  children: ReactNode;
  className?: string;
  tone?: "mist" | "standard" | "focus";
}) {
  return <section className={cn("glass-panel", `glass-panel--${tone}`, className)}>{children}</section>;
}

export function SeverityMark({ severity, className }: { severity: Severity; className?: string }) {
  return <span className={cn("severity-mark", `severity-mark--${severity}`, className)} aria-label={`${severity} severity`} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn("severity-badge", `severity-badge--${severity}`)}>
      <SeverityMark severity={severity} />
      {severity}
    </span>
  );
}

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const copy: Record<FindingStatus, string> = {
    open: "Open",
    resolved: "Resolved",
    accepted: "Accepted risk",
    needs_review: "Needs review",
  };
  return <span className={cn("finding-status", `finding-status--${status}`)}>{copy[status]}</span>;
}

const categoryIcons: Record<AuditCategory, typeof Activity> = {
  product: FileSearch,
  functional: Pointer,
  security: ShieldCheck,
  cloud: Cloud,
  api: Network,
  accessibility: Accessibility,
  performance: Gauge,
  code: Code2,
  database: Database,
  devops: Workflow,
  ai: Bot,
  launch: Rocket,
};

export function CategoryIcon({ category, size = 16 }: { category: AuditCategory; size?: number }) {
  const Icon = categoryIcons[category];
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}

export function MetricBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "sage" | "copper" | "rose" }) {
  return (
    <div className="metric-bar" aria-label={`${value}%`}>
      <span className={cn("metric-bar__fill", `metric-bar__fill--${tone}`)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__orb" />
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}
