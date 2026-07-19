import type { ReactNode } from "react";

import { IncidentSeverityBadge } from "@/components/incidents/IncidentSeverityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import {
  formatIncidentDate,
  formatServiceName,
} from "@/lib/incident-format";
import type { IncidentDetail } from "@/types/incidents";

type IncidentHeaderProps = {
  incidentDetail: IncidentDetail;
  actions?: ReactNode;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export function IncidentHeader({
  incidentDetail,
  actions,
}: IncidentHeaderProps) {
  const incident = incidentDetail.incident;

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
              {incident.incident_number}
            </p>

            <IncidentSeverityBadge
              severity={incident.severity}
            />

            <IncidentStatusBadge
              status={incident.status}
            />
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            {incident.title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {incidentDetail.description ??
              "No incident description has been recorded."}
          </p>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      <dl className="mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-700">
        <DetailItem
          label="Detected at"
          value={formatIncidentDate(
            incident.detected_at,
          )}
        />

        <DetailItem
          label="Affected service"
          value={formatServiceName(
            incidentDetail.primary_service,
          )}
        />

        <DetailItem
          label="Environment"
          value={incident.environment || "Not recorded"}
        />

        <DetailItem
          label="Assigned operator"
          value={
            incident.assigned_operator?.full_name ??
            incident.assigned_operator?.name ??
            incident.assigned_operator?.email ??
            incident.assigned_operator?.user_id ??
            "Unassigned"
          }
        />
      </dl>
    </section>
  );
}

export default IncidentHeader;
