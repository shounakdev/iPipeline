import {
  formatDuration,
  formatExperimentLabel,
} from "@/lib/experiment-format";
import type { ExperimentBenchmark } from "@/types/experiments";

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      ) : null}
    </article>
  );
}

export function BenchmarkSummary({
  benchmark,
}: {
  benchmark: ExperimentBenchmark | null;
}) {
  if (!benchmark) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Benchmark measurements</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Measurements will appear after the run reaches a terminal state.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Benchmark measurements</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            End-to-end response timings for this run.
          </p>
        </div>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold dark:border-slate-600">
          {formatExperimentLabel(benchmark.benchmark_status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Detection time" value={formatDuration(benchmark.time_to_detect_ms)} />
        <MetricCard label="Alert time" value={formatDuration(benchmark.time_to_alert_ms)} />
        <MetricCard label="Incident time" value={formatDuration(benchmark.time_to_incident_ms)} />
        <MetricCard label="Diagnosis time" value={formatDuration(benchmark.time_to_diagnose_ms)} />
        <MetricCard label="Approval time" value={formatDuration(benchmark.time_to_approve_ms)} />
        <MetricCard label="Recovery time" value={formatDuration(benchmark.time_to_recover_ms)} />
      </div>
    </section>
  );
}
