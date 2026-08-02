import {
  formatRemediationDate,
  formatRemediationLabel,
  formatRemediationValue,
} from "@/lib/remediation-format";
import type {
  RecoveryVerificationRecord,
} from "@/types/remediation";
import { RemediationStatusBadge } from "./RemediationStatusBadge";

type RemediationVerificationCardProps = {
  verification: RecoveryVerificationRecord | null;
};

type VerificationCheck = {
  label: string;
  passed: boolean;
};

export function RemediationVerificationCard({
  verification,
}: RemediationVerificationCardProps) {
  if (!verification) {
    return (
      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Recovery verification
        </h2>

        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          Recovery metrics have not been verified yet.
        </p>
      </section>
    );
  }

  const checks: VerificationCheck[] = [
    {
      label: "HTTP error rate recovered",
      passed: verification.error_rate_recovered,
    },
    {
      label: "P95 latency recovered",
      passed: verification.latency_recovered,
    },
    {
      label: "Pods healthy",
      passed: verification.pods_healthy,
    },
    {
      label: "No restart loop",
      passed: verification.restart_loop_absent,
    },
    {
      label: "Availability restored",
      passed: verification.availability_restored,
    },
  ];

  const metricEntries = Object.entries(
    verification.metrics_snapshot,
  );

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Recovery verification
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Post-execution health checks used to resolve
            the incident or mark failed recovery.
          </p>
        </div>

        <RemediationStatusBadge
          status={verification.verification_status}
        />
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {checks.map((check) => (
            <div
              key={check.label}
              className={
                "rounded-lg border p-4 " +
                (check.passed
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20")
              }
            >
              <p
                className={
                  "text-lg font-bold " +
                  (check.passed
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300")
                }
              >
                {check.passed ? "Passed" : "Failed"}
              </p>

              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {check.label}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Verification metrics
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified{" "}
              {formatRemediationDate(
                verification.verified_at,
              )}
            </p>
          </div>

          {metricEntries.length > 0 ? (
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {formatRemediationLabel(key)}
                  </dt>

                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatRemediationValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No metrics snapshot was stored.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RemediationVerificationCard;
