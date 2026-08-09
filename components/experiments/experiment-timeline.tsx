import {
  formatDateTime,
  formatExperimentLabel,
  readableValue,
  sortObservations,
} from "@/lib/experiment-format";
import type { ChaosObservation } from "@/types/experiments";

export function ExperimentTimeline({
  observations,
}: {
  observations: ChaosObservation[];
}) {
  const ordered = sortObservations(observations);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Observation timeline</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Ordered evidence captured across detection, diagnosis and recovery.
      </p>

      {ordered.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          No observations have been recorded yet.
        </p>
      ) : (
        <ol className="mt-6 space-y-0">
          {ordered.map((observation, index) => (
            <li key={observation.id} className="relative grid grid-cols-[1rem_1fr] gap-4 pb-6 last:pb-0">
              {index < ordered.length - 1 ? (
                <span className="absolute left-[7px] top-4 h-full w-px bg-slate-300 dark:bg-slate-700" />
              ) : null}
              <span className="relative z-10 mt-1 h-4 w-4 rounded-full border-4 border-blue-100 bg-blue-600 dark:border-blue-950" />
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-950 dark:text-slate-100">
                    {formatExperimentLabel(observation.observation_type)}
                  </p>
                  <time className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(observation.observed_at)}
                  </time>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Source: {observation.source}
                  {observation.resource_type ? ` · ${observation.resource_type}` : ""}
                </p>
                {Object.keys(observation.details).length > 0 ? (
                  <dl className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950/60 sm:grid-cols-2">
                    {Object.entries(observation.details).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-medium text-slate-500 dark:text-slate-400">
                          {formatExperimentLabel(key)}
                        </dt>
                        <dd className="mt-0.5 break-words text-slate-800 dark:text-slate-200">
                          {readableValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
