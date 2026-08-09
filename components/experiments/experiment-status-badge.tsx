import { formatExperimentLabel } from "@/lib/experiment-format";
import type { ChaosRunStatus } from "@/types/experiments";

const STATUS_STYLES: Record<ChaosRunStatus, string> = {
  PENDING: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
  RUNNING: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  FAULT_INJECTED: "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  OBSERVING: "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
  RECOVERING: "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
  COMPLETED: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  FAILED: "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
  ABORTED: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
};

export function ExperimentStatusBadge({
  status,
}: {
  status: ChaosRunStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {formatExperimentLabel(status)}
    </span>
  );
}
