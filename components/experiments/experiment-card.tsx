import Link from "next/link";

import {
  formatDateTime,
  formatDuration,
  formatExperimentLabel,
  isActiveRunStatus,
} from "@/lib/experiment-format";
import type { ExperimentListItem } from "@/types/experiments";
import { ExperimentStatusBadge } from "./experiment-status-badge";

export function ExperimentCard({
  item,
  canManage,
  busy,
  onStart,
  onAbort,
}: {
  item: ExperimentListItem;
  canManage: boolean;
  busy: boolean;
  onStart: () => void;
  onAbort: () => void;
}) {
  const { experiment, latestRun, serviceName } = item;
  const benchmark = latestRun?.benchmark ?? null;
  const active = isActiveRunStatus(latestRun?.status);

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{experiment.name}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatExperimentLabel(experiment.scenario_type)}</p>
        </div>
        {latestRun ? <ExperimentStatusBadge status={latestRun.status} /> : (
          <span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700">Not run</span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt className="text-slate-500 dark:text-slate-400">Target service</dt><dd className="mt-0.5 font-medium">{serviceName}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Environment</dt><dd className="mt-0.5 font-medium">{experiment.target_environment}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Diagnosis</dt><dd className="mt-0.5 font-medium">{benchmark ? formatExperimentLabel(benchmark.diagnosis_rating) : "—"}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Detection time</dt><dd className="mt-0.5 font-medium">{formatDuration(benchmark?.time_to_detect_ms ?? null)}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Recovery time</dt><dd className="mt-0.5 font-medium">{formatDuration(benchmark?.time_to_recover_ms ?? null)}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Last executed</dt><dd className="mt-0.5 font-medium">{formatDateTime(latestRun?.started_at)}</dd></div>
      </dl>

      {latestRun?.status === "FAILED" && latestRun.failure_message ? (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{latestRun.failure_message}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/experiments/${experiment.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">View experiment</Link>
        {active ? (
          <button type="button" onClick={onAbort} disabled={!canManage || busy} title={!canManage ? "Admin or operator role required" : undefined} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Aborting…" : "Abort run"}</button>
        ) : (
          <button type="button" onClick={onStart} disabled={!canManage || busy || !experiment.enabled} title={!canManage ? "Admin or operator role required" : undefined} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Start run</button>
        )}
      </div>
    </article>
  );
}
