import Link from "next/link";

import { IncidentSeverityBadge } from "@/components/incidents/IncidentSeverityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import {
  INCIDENT_SEVERITY_PRIORITY,
  isOpenIncidentStatus,
} from "@/lib/incident-status";
import type {
  IncidentListItem,
  OperatorSummary,
} from "@/types/incidents";

type IncidentsTableProps = {
  incidents: IncidentListItem[];
  loading?: boolean;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor(
    (seconds % 86_400) / 3_600,
  );
  const minutes = Math.floor(
    (seconds % 3_600) / 60,
  );

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

function getResponseAge(
  incident: IncidentListItem,
): string {
  const detectedAt = new Date(
    incident.detected_at,
  ).getTime();

  const endedAt = incident.resolved_at
    ? new Date(incident.resolved_at).getTime()
    : Date.now();

  if (
    Number.isNaN(detectedAt) ||
    Number.isNaN(endedAt)
  ) {
    return "—";
  }

  return formatDuration(
    (endedAt - detectedAt) / 1_000,
  );
}

function getOperatorLabel(
  operator: OperatorSummary | null,
): string {
  if (!operator) {
    return "Unassigned";
  }

  return (
    operator.full_name ??
    operator.name ??
    operator.email ??
    operator.user_id ??
    operator.id ??
    "Assigned"
  );
}

function shortIdentifier(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  return value.length > 12
    ? `${value.slice(0, 12)}…`
    : value;
}

function sortIncidents(
  incidents: IncidentListItem[],
): IncidentListItem[] {
  return [...incidents].sort((left, right) => {
    const leftOpen = isOpenIncidentStatus(
      left.status,
    )
      ? 1
      : 0;

    const rightOpen = isOpenIncidentStatus(
      right.status,
    )
      ? 1
      : 0;

    if (leftOpen !== rightOpen) {
      return rightOpen - leftOpen;
    }

    const severityDifference =
      INCIDENT_SEVERITY_PRIORITY[right.severity] -
      INCIDENT_SEVERITY_PRIORITY[left.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return (
      new Date(right.detected_at).getTime() -
      new Date(left.detected_at).getTime()
    );
  });
}

export function IncidentsTable({
  incidents,
  loading = false,
}: IncidentsTableProps) {
  if (loading) {
    return (
      <div className="px-6 py-16 text-center text-sm text-slate-600 dark:text-slate-400">
        Loading incidents…
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="m-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No incidents match the selected filters.
      </div>
    );
  }

  const sortedIncidents =
    sortIncidents(incidents);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] text-left text-sm">
        <thead className="border-b border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <tr className="text-xs font-semibold uppercase tracking-wide">
            <th className="px-4 py-3">Incident</th>
            <th className="px-4 py-3">Severity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">
              Environment
            </th>
            <th className="px-4 py-3">
              Assigned operator
            </th>
            <th className="px-4 py-3">
              Suspected deployment
            </th>
            <th className="px-4 py-3">
              Detected at
            </th>
            <th className="px-4 py-3">
              Response age
            </th>
          </tr>
        </thead>

        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {sortedIncidents.map((incident) => (
            <tr
              key={incident.incident_id}
              className="border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <td className="px-4 py-4">
                <Link
                  href={`/incidents/${incident.incident_id}`}
                  className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  {incident.incident_number}
                </Link>

                <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">
                  {incident.title}
                </p>
              </td>

              <td className="px-4 py-4">
                <IncidentSeverityBadge
                  severity={incident.severity}
                />
              </td>

              <td className="px-4 py-4">
                <IncidentStatusBadge
                  status={incident.status}
                />
              </td>

              <td className="px-4 py-4">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {incident.service_name ??
                    incident.service_id}
                </p>

                {incident.service_name && (
                  <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500 dark:text-slate-400">
                    {incident.service_id}
                  </p>
                )}
              </td>

              <td className="px-4 py-4">
                {incident.environment}
              </td>

              <td className="px-4 py-4">
                {getOperatorLabel(
                  incident.assigned_operator,
                )}
              </td>

              <td className="px-4 py-4">
                {incident.suspected_deployment_id ? (
                  <Link
                    href={`/deployments/${incident.suspected_deployment_id}`}
                    className="font-mono text-xs text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {shortIdentifier(
                      incident.suspected_deployment_id,
                    )}
                  </Link>
                ) : (
                  "—"
                )}
              </td>

              <td className="px-4 py-4">
                {formatDate(incident.detected_at)}
              </td>

              <td className="px-4 py-4">
                <span
                  className={
                    incident.status === "RESOLVED"
                      ? "text-slate-600 dark:text-slate-400"
                      : "font-medium text-orange-700 dark:text-orange-400"
                  }
                >
                  {getResponseAge(incident)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentsTable;
