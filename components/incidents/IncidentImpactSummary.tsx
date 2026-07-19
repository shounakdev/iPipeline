import {
  formatIdentifier,
  formatServiceName,
} from "@/lib/incident-format";
import type {
  IncidentDetail,
  IncidentMetricsResponse,
} from "@/types/incidents";

type IncidentImpactSummaryProps = {
  incidentDetail: IncidentDetail;
  metrics: IncidentMetricsResponse;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function formatNumber(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "Not recorded";
  }

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2);
}

export function IncidentImpactSummary({
  incidentDetail,
  metrics,
}: IncidentImpactSummaryProps) {
  const incident = incidentDetail.incident;
  const alert = incidentDetail.triggering_alert;

  const alertId =
    alert?.alert_id ??
    alert?.id ??
    incidentDetail.triggering_alert_id;

  const affectedServices =
    incidentDetail.affected_services.length > 0
      ? incidentDetail.affected_services
          .map(formatServiceName)
          .join(", ")
      : formatServiceName(
          incidentDetail.primary_service,
        );

  const triggeredValue =
    metrics.triggered_value ??
    alert?.triggered_value ??
    null;

  const threshold =
    metrics.alert_threshold ??
    alert?.threshold ??
    null;

  const errorBudgetState =
    metrics.error_budget_status ??
    alert?.error_budget_status ??
    "Not recorded";

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Impact summary
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Service impact and the reliability condition that
          triggered this incident.
        </p>
      </div>

      <dl className="grid gap-5 p-5 sm:grid-cols-2">
        <DetailItem
          label="Affected service"
          value={affectedServices}
        />

        <DetailItem
          label="Environment"
          value={
            incident.environment ||
            "Not recorded"
          }
        />

        <DetailItem
          label="Triggering alert"
          value={
            alertId
              ? formatIdentifier(alertId, 20)
              : "Not recorded"
          }
        />

        <DetailItem
          label="Alert type"
          value={
            alert?.alert_type ??
            "Not recorded"
          }
        />

        <DetailItem
          label="SLO type"
          value={
            alert?.slo_type ??
            "Not recorded"
          }
        />

        <DetailItem
          label="Triggered value"
          value={formatNumber(triggeredValue)}
        />

        <DetailItem
          label="Threshold"
          value={formatNumber(threshold)}
        />

        <DetailItem
          label="Error-budget state"
          value={errorBudgetState}
        />
      </dl>
    </section>
  );
}

export default IncidentImpactSummary;
