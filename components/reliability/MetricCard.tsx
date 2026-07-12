import {
  formatDate,
  formatMetricValue,
  formatTarget,
} from "@/lib/reliability-format";
import type {
  ReliabilitySLOState,
  SLOMetricType,
} from "@/types/reliability";

import { StatusBadge } from "./StatusBadge";

type MetricCardProps = {
  title: string;
  metricType: SLOMetricType;
  measurement: ReliabilitySLOState | null;
};

export function MetricCard({
  title,
  metricType,
  measurement,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-600">
          {title}
        </h2>
        <StatusBadge status={measurement?.status ?? "NO_DATA"} />
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {formatMetricValue(
          metricType,
          measurement?.measured_value,
        )}
      </p>

      <p className="mt-2 text-sm text-slate-600">
        {formatTarget(
          metricType,
          measurement?.target_value,
        )}
      </p>

      <p className="mt-5 text-xs text-slate-500">
        Last evaluated:{" "}
        {formatDate(measurement?.evaluated_at)}
      </p>
    </article>
  );
}