import { formatExperimentLabel } from "@/lib/experiment-format";
import type { ExperimentRun } from "@/types/experiments";

function ResultRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
        {value || "Not available"}
      </dd>
    </div>
  );
}

export function DiagnosisResult({ run }: { run: ExperimentRun | null }) {
  const benchmark = run?.benchmark ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Diagnosis & remediation</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Root-cause correctness and linked recovery workflow.
      </p>

      {run?.status === "FAILED" && run.failure_message ? (
        <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">Run failed</p>
          <p className="mt-1">{run.failure_message}</p>
        </div>
      ) : null}

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <ResultRow label="RCA output" value={benchmark?.actual_root_cause ?? null} />
        <ResultRow label="Expected root cause" value={benchmark?.expected_root_cause ?? null} />
        <ResultRow
          label="Diagnosis correctness"
          value={benchmark ? formatExperimentLabel(benchmark.diagnosis_rating) : null}
        />
        <ResultRow label="RCA report" value={run?.rca_report_id ?? null} />
        <ResultRow label="Remediation recommendation" value={run?.remediation_id ?? null} />
        <ResultRow
          label="Approval status"
          value={
            run?.observations.some((item) => item.observation_type === "REMEDIATION_APPROVED")
              ? "Approved"
              : run?.remediation_id
                ? "Pending"
                : null
          }
        />
        <ResultRow label="Execution result" value={run?.remediation_execution_id ?? null} />
        <ResultRow label="Recovery verification" value={run?.recovery_verification_id ?? null} />
      </dl>
    </section>
  );
}
