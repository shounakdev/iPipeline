import type {
  IncidentMetric,
  IncidentMetricsResponse,
} from "@/types/incidents";

type IncidentMetricsCardProps = {
  metrics: IncidentMetricsResponse;
};

function normalizeMetricKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findMetric(
  metrics: IncidentMetric[],
  candidates: string[],
): IncidentMetric | null {
  const normalizedCandidates = candidates.map(
    normalizeMetricKey,
  );

  return (
    metrics.find((metric) => {
      const metricName = normalizeMetricKey(
        metric.metric_name,
      );

      const metricType = normalizeMetricKey(
        metric.metric_type,
      );

      return normalizedCandidates.some(
        (candidate) =>
          metricName.includes(candidate) ||
          metricType.includes(candidate),
      );
    }) ?? null
  );
}

function formatMetricValue(
  metric: IncidentMetric | null,
): string {
  if (!metric) {
    return "Not recorded";
  }

  const formattedValue = Number.isInteger(metric.value)
    ? metric.value.toString()
    : metric.value.toFixed(2);

  return metric.unit
    ? `${formattedValue} ${metric.unit}`
    : formattedValue;
}

function MetricItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-100">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </article>
  );
}

export function IncidentMetricsCard({
  metrics,
}: IncidentMetricsCardProps) {
  const availability = findMetric(
    metrics.metric_snapshot,
    ["availability"],
  );

  const latency = findMetric(
    metrics.metric_snapshot,
    [
      "p95latency",
      "latencyp95",
      "latency",
    ],
  );

  const errorRate = findMetric(
    metrics.metric_snapshot,
    ["errorrate"],
  );

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Metrics snapshot
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Reliability measurements and incident-response
          timing.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricItem
          label="Availability"
          value={formatMetricValue(availability)}
          description={
            availability
              ? `Captured ${new Date(
                  availability.captured_at,
                ).toLocaleString()}`
              : undefined
          }
        />

        <MetricItem
          label="P95 latency"
          value={formatMetricValue(latency)}
          description={
            latency
              ? `Captured ${new Date(
                  latency.captured_at,
                ).toLocaleString()}`
              : undefined
          }
        />

        <MetricItem
          label="Error rate"
          value={formatMetricValue(errorRate)}
          description={
            errorRate
              ? `Captured ${new Date(
                  errorRate.captured_at,
                ).toLocaleString()}`
              : undefined
          }
        />

        <MetricItem
          label="Error budget"
          value={
            metrics.error_budget_status ??
            "Not recorded"
          }
        />

        <MetricItem
          label="Triggered value"
          value={
            metrics.triggered_value !== null
              ? String(metrics.triggered_value)
              : "Not recorded"
          }
        />

        <MetricItem
          label="Alert threshold"
          value={
            metrics.alert_threshold !== null
              ? String(metrics.alert_threshold)
              : "Not recorded"
          }
        />

        <MetricItem
          label="MTTD"
          value={
            metrics.mttd_display ??
            "Not available"
          }
          description="Mean time to detect"
        />

        <MetricItem
          label="MTTA"
          value={
            metrics.mtta_display ??
            "Not available"
          }
          description="Mean time to acknowledge"
        />

        <MetricItem
          label="MTTR"
          value={
            metrics.mttr_display ??
            "Not available"
          }
          description="Mean time to resolve"
        />
      </div>
    </section>
  );
}

export default IncidentMetricsCard;
