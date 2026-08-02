import Link from "next/link";
import {
  formatRemediationAction,
  formatRemediationDate,
} from "@/lib/remediation-format";
import type {
  RemediationRecommendation,
} from "@/types/remediation";
import { RemediationStatusBadge } from "./RemediationStatusBadge";

type RemediationSummaryCardProps = {
  remediation: RemediationRecommendation;
  showIncidentLink?: boolean;
};

export function RemediationSummaryCard({
  remediation,
  showIncidentLink = false,
}: RemediationSummaryCardProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recommended action
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {formatRemediationAction(
              remediation.action_type,
            )}
          </h2>
        </div>

        <RemediationStatusBadge
          status={remediation.status}
        />
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Why this action was recommended
          </h3>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
            {remediation.reason}
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Service
            </dt>

            <dd className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">
              {remediation.service_id}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Environment
            </dt>

            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {remediation.environment}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Confidence
            </dt>

            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {remediation.confidence}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Created
            </dt>

            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatRemediationDate(
                remediation.created_at,
              )}
            </dd>
          </div>
        </dl>

        {showIncidentLink ? (
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <Link
              href={
                `/incidents/${remediation.incident_id}`
              }
              className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              View associated incident
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RemediationSummaryCard;
