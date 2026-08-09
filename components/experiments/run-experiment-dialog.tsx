"use client";

import type { Experiment } from "@/types/experiments";

export function RunExperimentDialog({
  experiment,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  experiment: Experiment | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !experiment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="run-dialog-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="run-dialog-title" className="text-xl font-semibold">Start experiment run?</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-slate-100">{experiment.name}</strong> will inject {experiment.failure_type.toLowerCase().replaceAll("_", " ")} into {experiment.target_environment}. The configured cleanup runs automatically.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {busy ? "Starting…" : "Start run"}
          </button>
        </div>
      </div>
    </div>
  );
}
