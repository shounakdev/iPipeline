"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Deployment = {
  id: string;
  service_id: string;
  pipeline_run_id?: string | null;
  environment_id?: string | null;
  commit_sha?: string | null;
  image_tag: string;
  deployment_version?: string | null;
  argo_sync_status?: string | null;
  kubernetes_rollout_status?: string | null;
  previous_revision?: string | null;
  namespace?: string | null;
  cluster_name?: string | null;
  service_name?: string | null;
  argo_application_name?: string | null;
  pod_count?: number | null;
  restart_count?: number | null;
  failure_reason?: string | null;
  deployed_at?: string | null;
  created_at: string;
};

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeployments() {
      try {
        const data = await apiFetch<Deployment[]>("/api/deployments");
        setDeployments(data);
      } finally {
        setLoading(false);
      }
    }

    loadDeployments();
  }, []);

  if (loading) {
    return <div className="p-6">Loading deployments...</div>;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deployments</h1>
        <p className="text-sm opacity-70">
          Runtime deployment history from Kubernetes and Argo CD.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">Service</th>
              <th className="p-3">Environment</th>
              <th className="p-3">Version</th>
              <th className="p-3">Commit</th>
              <th className="p-3">Pipeline</th>
              <th className="p-3">Argo</th>
              <th className="p-3">Kubernetes</th>
              <th className="p-3">Pods</th>
              <th className="p-3">Restarts</th>
              <th className="p-3">Previous</th>
              <th className="p-3">Deployed</th>
            </tr>
          </thead>

          <tbody>
            {deployments.map((deployment) => (
              <tr key={deployment.id} className="border-b">
                <td className="p-3">
                  <Link
                    href={`/deployments/${deployment.id}`}
                    className="font-medium underline"
                  >
                    {deployment.service_name || deployment.service_id}
                  </Link>
                </td>

                <td className="p-3">
                  {deployment.namespace || deployment.environment_id || "-"}
                </td>

                <td className="p-3">
                  {deployment.deployment_version || "-"}
                </td>

                <td className="p-3">
                  {deployment.commit_sha
                    ? deployment.commit_sha.slice(0, 12)
                    : "-"}
                </td>

                <td className="p-3">
                  {deployment.pipeline_run_id ? (
                    <Link
                      href={`/pipeline/${deployment.pipeline_run_id}`}
                      className="underline"
                    >
                      View
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3">
                  {deployment.argo_sync_status || "UNKNOWN"}
                </td>

                <td className="p-3">
                  {deployment.kubernetes_rollout_status || "UNKNOWN"}
                </td>

                <td className="p-3">
                  {deployment.pod_count ?? 0}
                </td>

                <td className="p-3">
                  {deployment.restart_count ?? 0}
                </td>

                <td className="p-3">
                  {deployment.previous_revision || "-"}
                </td>

                <td className="p-3">
                  {deployment.deployed_at
                    ? new Date(deployment.deployed_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}