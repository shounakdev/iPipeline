import Link from "next/link";

import {
  alertLabel,
  deploymentLabel,
  formatAlertValue,
  formatDate,
} from "@/lib/reliability-format";
import type {
  ReliabilityAlert,
  ReliabilitySeverity,
} from "@/types/reliability";

import { StatusBadge } from "./StatusBadge";

type ReliabilityAlertsTableProps = {
  alerts: ReliabilityAlert[];
};

const STATUS_ORDER: Record<string, number> = {
  OPEN: 0,
  ACKNOWLEDGED: 1,
  RESOLVED: 2,
};

function severityClass(
  severity: ReliabilitySeverity,
): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "LOW":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function ReliabilityAlertsTable({
  alerts,
}: ReliabilityAlertsTableProps) {
  const sortedAlerts = [...alerts].sort((left, right) => {
    const statusDifference =
      (STATUS_ORDER[left.status.toUpperCase()] ?? 99) -
      (STATUS_ORDER[right.status.toUpperCase()] ?? 99);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return (
      new Date(right.created_at).getTime() -
      new Date(left.created_at).getTime()
    );
  });

  if (sortedAlerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="font-medium text-slate-700">
          No active reliability alerts
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Open and acknowledged alerts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Alert</th>
            <th className="px-4 py-3">Severity</th>
            <th className="px-4 py-3">Triggered</th>
            <th className="px-4 py-3">Threshold</th>
            <th className="px-4 py-3">Deployment</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedAlerts.map((alert) => (
            <tr key={alert.id} className="text-slate-700">
              <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                {alertLabel(alert)}
              </td>

              <td className="whitespace-nowrap px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(
                    alert.severity,
                  )}`}
                >
                  {alert.severity}
                </span>
              </td>

              <td className="whitespace-nowrap px-4 py-4">
                {formatAlertValue(
                  alert,
                  alert.triggered_value,
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-4">
                {formatAlertValue(
                  alert,
                  alert.threshold_value,
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-4">
                {alert.deployment ? (
                  <Link
                    href={`/deployments/${alert.deployment.id}`}
                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {deploymentLabel(alert.deployment)}
                  </Link>
                ) : (
                  <span className="text-slate-500">
                    Not linked
                  </span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-4">
                <StatusBadge status={alert.status} />
              </td>

              <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                {formatDate(alert.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}