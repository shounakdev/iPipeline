import { ReliabilityStatusBadge } from "./ReliabilityStatusBadge";

interface ReliabilityMeasurement {
  measurement_id: string;
  slo_definition_id?: string;
  service_id?: string;
  service_name?: string;
  metric_type: string;
  measured_value: number;
  target_value: number;
  is_breached: boolean;
  window_minutes?: number;
  source?: string;
  evaluated_at: string;
}

interface RecentMeasurementsTableProps {
  measurements: ReliabilityMeasurement[];
  limit?: number;
}

function formatMetricName(metricType: string): string {
  return metricType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetricValue(
  metricType: string,
  value: number,
): string {
  const normalizedMetric = metricType.toUpperCase();

  if (normalizedMetric.includes("LATENCY")) {
    return `${value.toFixed(0)} ms`;
  }

  if (
    normalizedMetric.includes("AVAILABILITY") ||
    normalizedMetric.includes("ERROR_RATE")
  ) {
    return `${value.toFixed(2)}%`;
  }

  return value.toFixed(2);
}

function formatEvaluatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function RecentMeasurementsTable({
  measurements,
  limit = 15,
}: RecentMeasurementsTableProps) {
  const recentMeasurements = [...measurements]
    .sort(
      (first, second) =>
        new Date(second.evaluated_at).getTime() -
        new Date(first.evaluated_at).getTime(),
    )
    .slice(0, limit);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent measurements
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest SLO evaluations and their current result.
        </p>
      </div>

      {recentMeasurements.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            No measurements available
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Measurements will appear after an SLO evaluation runs.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Evaluated At
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Metric
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Measured
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Target
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Result
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {recentMeasurements.map((measurement) => (
                <tr
                  key={measurement.measurement_id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatEvaluatedAt(measurement.evaluated_at)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {formatMetricName(measurement.metric_type)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                    {formatMetricValue(
                      measurement.metric_type,
                      measurement.measured_value,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatMetricValue(
                      measurement.metric_type,
                      measurement.target_value,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <ReliabilityStatusBadge
                      status={
                        measurement.is_breached
                          ? "BREACHED"
                          : "HEALTHY"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}