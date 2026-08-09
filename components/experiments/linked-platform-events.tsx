import Link from "next/link";

import { formatDateTime } from "@/lib/experiment-format";
import type { ExperimentRun } from "@/types/experiments";

export function LinkedPlatformEvents({ run }: { run: ExperimentRun | null }) {
  const alert = run?.observations.find(
    (item) => item.observation_type === "ALERT_CREATED",
  );
  const incident = run?.observations.find(
    (item) => item.observation_type === "INCIDENT_CREATED",
  );
  const alertId = alert?.resource_id ?? null;
  const incidentId = run?.incident_id ?? incident?.resource_id ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Linked platform events</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Alert</p>
          {alertId ? (
            <Link href={`/reliability?alertId=${encodeURIComponent(alertId)}`} className="mt-2 block break-all font-medium text-blue-700 hover:underline dark:text-blue-400">
              {alertId}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No alert linked</p>
          )}
          {alert ? <p className="mt-1 text-xs text-slate-500">{formatDateTime(alert.observed_at)}</p> : null}
        </article>
        <article className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Incident</p>
          {incidentId ? (
            <Link href={`/incidents/${encodeURIComponent(incidentId)}`} className="mt-2 block break-all font-medium text-blue-700 hover:underline dark:text-blue-400">
              {incidentId}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No incident linked</p>
          )}
          {incident ? <p className="mt-1 text-xs text-slate-500">{formatDateTime(incident.observed_at)}</p> : null}
        </article>
      </div>
    </section>
  );
}
