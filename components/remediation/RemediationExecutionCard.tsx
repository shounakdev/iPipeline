import {
  formatRemediationDate,
  formatRemediationLabel,
  formatRemediationValue,
} from "@/lib/remediation-format";
import type {
  RemediationExecutionRecord,
} from "@/types/remediation";
import { RemediationStatusBadge } from "./RemediationStatusBadge";

type RemediationExecutionCardProps = {
  execution: RemediationExecutionRecord | null;
};

export function RemediationExecutionCard({
  execution,
}: RemediationExecutionCardProps) {
  if (!execution) {
    return (
      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Execution and platform result
        </h2>

        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          No Argo CD or Kubernetes remediation command
          has been executed.
        </p>
      </section>
    );
  }

  const resultEntries = Object.entries(
    execution.result_summary,
  );

  const commandEntries = Object.entries(
    execution.command_payload,
  );

  const adapterCommand =
    execution.result_summary["command_type"];

  const resultMessage =
    execution.result_summary["message"];

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Execution and platform result
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Stored command activity and the Argo CD or
            Kubernetes adapter response.
          </p>
        </div>

        <RemediationStatusBadge
          status={execution.execution_status}
        />
      </div>

      <div className="space-y-5 p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Platform command
            </dt>

            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {typeof adapterCommand === "string"
                ? formatRemediationLabel(
                    adapterCommand,
                  )
                : formatRemediationLabel(
                    execution.command_type,
                  )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Execution ID
            </dt>

            <dd className="mt-1 break-all text-sm text-slate-800 dark:text-slate-200">
              {execution.id}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Started
            </dt>

            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {formatRemediationDate(
                execution.started_at,
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Completed
            </dt>

            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {formatRemediationDate(
                execution.completed_at,
              )}
            </dd>
          </div>
        </dl>

        {typeof resultMessage === "string" ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
            {resultMessage}
          </div>
        ) : null}

        {execution.error_message ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Execution failure
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm text-red-700 dark:text-red-300">
              {execution.error_message}
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Command payload
            </h3>

            {commandEntries.length > 0 ? (
              <dl className="mt-3 space-y-3">
                {commandEntries.map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {formatRemediationLabel(key)}
                      </dt>

                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">
                        {formatRemediationValue(value)}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No command payload was stored.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Adapter result
            </h3>

            {resultEntries.length > 0 ? (
              <dl className="mt-3 space-y-3">
                {resultEntries.map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {formatRemediationLabel(key)}
                      </dt>

                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">
                        {formatRemediationValue(value)}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No adapter result was stored.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default RemediationExecutionCard;
