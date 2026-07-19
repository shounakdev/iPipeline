import Link from "next/link";

import {
  formatIdentifier,
  formatIncidentDate,
} from "@/lib/incident-format";
import type { DeploymentSummary } from "@/types/incidents";

type SuspectedDeploymentCardProps = {
  deployment: DeploymentSummary | null;
  deploymentId?: string | null;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export function SuspectedDeploymentCard({
  deployment,
  deploymentId,
}: SuspectedDeploymentCardProps) {
  const resolvedDeploymentId =
    deployment?.deployment_id ??
    deployment?.id ??
    deploymentId ??
    null;

  if (!resolvedDeploymentId) {
    return (
      <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold">
            Deployment correlation
          </h2>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            No deployment has been correlated with this
            incident.
          </div>
        </div>
      </section>
    );
  }

  const commit =
    deployment?.commit_sha ??
    deployment?.commit_hash ??
    null;

  const deployedAt =
    deployment?.deployed_at ??
    deployment?.created_at ??
    null;

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-300 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Deployment correlation
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Deployment activity associated with the
            incident window.
          </p>
        </div>

        <Link
          href={`/deployments/${resolvedDeploymentId}`}
          className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          View deployment
        </Link>
      </div>

      <div className="p-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Deployment"
            value={formatIdentifier(
              resolvedDeploymentId,
              20,
            )}
          />

          <DetailItem
            label="Version"
            value={
              deployment?.version ??
              "Not recorded"
            }
          />

          <DetailItem
            label="Commit"
            value={
              commit
                ? formatIdentifier(commit, 16)
                : "Not recorded"
            }
          />

          <DetailItem
            label="Deployment time"
            value={formatIncidentDate(deployedAt)}
          />

          <DetailItem
            label="Environment"
            value={
              deployment?.environment ??
              "Not recorded"
            }
          />

          <DetailItem
            label="Status"
            value={
              deployment?.status ??
              "Not recorded"
            }
          />
        </dl>

        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          This deployment is correlated with the incident
          timeline. Correlation does not confirm that the
          deployment caused the incident.
        </div>
      </div>
    </section>
  );
}

export default SuspectedDeploymentCard;
