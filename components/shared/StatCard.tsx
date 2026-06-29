import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/shared/InfoTip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;    // positivo = alta, negativo = queda
    label?: string;
  };
  info?: string;      // Texto do InfoTip ⓘ
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  info,
  className,
}: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNeutral  = trend && trend.value === 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNeutral ? Minus : TrendingDown;
  const trendColor = trendPositive
    ? "text-success"
    : trendNeutral
    ? "text-text-muted"
    : "text-error";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border hover:shadow-card hover:shadow-black/40",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          {info && <InfoTip title={title} content={info} side="right" />}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover transition-colors group-hover:bg-primary-subtle",
            iconColor
          )}
        >
          <Icon className="h-4.5 w-4.5 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Valor principal */}
      <div className="mt-3">
        <p className="font-display text-2xl font-bold text-text-primary animate-count-up">
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>
            {trendPositive && "+"}
            {trend.value}% {trend.label ?? "este mês"}
          </span>
        </div>
      )}
    </div>
  );
}
