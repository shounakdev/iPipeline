"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

type Workload = {
  id: string;
  deployment_id: string;
  workload_name: string;
  namespace: string;
  kind: string;
  desired_replicas: number;
  available_replicas: number;
  pod_count: number;
  restart_count: number;
  status: string;
  failure_reason?: string | null;
  created_at: string;
};

export default function DeploymentDetailPage() {
  const params = useParams<{ deploymentId: string }>();
  const deploymentId = params.deploymentId;

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deploymentId) return;

    async function loadDeployment() {
      try {
        setLoading(true);
        setError(null);

        const deploymentData = await apiFetch<Deployment>(
          `/api/deployments/${deploymentId}`
        );

        const workloadData = await apiFetch<Workload[]>(
          `/api/deployments/${deploymentId}/workloads`
        );

        setDeployment(deploymentData);
        setWorkloads(workloadData);
      } catch (err) {
        console.error("Failed to load deployment", err);
        setError("Failed to load deployment details.");
      } finally {
        setLoading(false);
      }
    }

    loadDeployment();
  }, [deploymentId]);

  if (loading) {
    return <div className="p-6">Loading deployment...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <Link href="/deployments" className="text-sm underline">
          Back to deployments
        </Link>

        <div className="rounded-lg border border-red-500 p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!deployment) {
    return <div className="p-6">Deployment not found.</div>;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href="/deployments" className="text-sm underline">
          Back to deployments
        </Link>

        <h1 className="mt-3 text-2xl font-semibold">
          {deployment.service_name || "Deployment"}
        </h1>

        <p className="text-sm opacity-70">Deployment ID: {deployment.id}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Version</div>
          <div className="text-xl font-semibold">
            {deployment.deployment_version || "-"}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Argo CD</div>
          <div className="text-xl font-semibold">
            {deployment.argo_sync_status || "UNKNOWN"}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Kubernetes</div>
          <div className="text-xl font-semibold">
            {deployment.kubernetes_rollout_status || "UNKNOWN"}
          </div>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Deployment Summary</h2>

        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <span className="opacity-70">Image:</span>{" "}
            <code>{deployment.image_tag}</code>
          </div>

          <div>
            <span className="opacity-70">Commit:</span>{" "}
            {deployment.commit_sha || "-"}
          </div>

          <div>
            <span className="opacity-70">Namespace:</span>{" "}
            {deployment.namespace || "-"}
          </div>

          <div>
            <span className="opacity-70">Cluster:</span>{" "}
            {deployment.cluster_name || "-"}
          </div>

          <div>
            <span className="opacity-70">Pods:</span>{" "}
            {deployment.pod_count ?? 0}
          </div>

          <div>
            <span className="opacity-70">Restarts:</span>{" "}
            {deployment.restart_count ?? 0}
          </div>

          <div>
            <span className="opacity-70">Previous revision:</span>{" "}
            {deployment.previous_revision || "-"}
          </div>

          <div>
            <span className="opacity-70">Deployed at:</span>{" "}
            {deployment.deployed_at
              ? new Date(deployment.deployed_at).toLocaleString()
              : "-"}
          </div>

          <div>
            <span className="opacity-70">Pipeline:</span>{" "}
            {deployment.pipeline_run_id ? (
              <Link
                href={`/pipeline/${deployment.pipeline_run_id}`}
                className="underline"
              >
                View linked pipeline
              </Link>
            ) : (
              "-"
            )}
          </div>
        </div>

        {deployment.failure_reason && (
          <div className="rounded border p-3 text-sm">
            <div className="font-semibold">Failure reason</div>
            <div>{deployment.failure_reason}</div>
          </div>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Workloads</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Namespace</th>
                <th className="p-3">Replicas</th>
                <th className="p-3">Pods</th>
                <th className="p-3">Restarts</th>
                <th className="p-3">Status</th>
                <th className="p-3">Failure</th>
              </tr>
            </thead>

            <tbody>
              {workloads.map((workload) => (
                <tr key={workload.id} className="border-b">
                  <td className="p-3">{workload.workload_name}</td>
                  <td className="p-3">{workload.kind}</td>
                  <td className="p-3">{workload.namespace}</td>
                  <td className="p-3">
                    {workload.available_replicas}/{workload.desired_replicas}
                  </td>
                  <td className="p-3">{workload.pod_count}</td>
                  <td className="p-3">{workload.restart_count}</td>
                  <td className="p-3">{workload.status}</td>
                  <td className="p-3">{workload.failure_reason || "-"}</td>
                </tr>
              ))}

              {workloads.length === 0 && (
                <tr>
                  <td className="p-3 opacity-70" colSpan={8}>
                    No workloads captured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}