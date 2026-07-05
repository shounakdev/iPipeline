"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type HealthSummary = {
  service_id: string;
  service_name: string;
  environment: string;
  status: string;
  latency_ms?: number | null;
  error_rate?: number | null;
  pod_restart_count?: number | null;
  available_replicas?: number | null;
  replica_count?: number | null;
  created_at?: string;
};

function statusClass(status: string) {
  switch (status) {
    case "HEALTHY":
      return "bg-green-100 text-green-700 border-green-200";
    case "DEGRADED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "UNHEALTHY":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export default function ObservabilityPage() {
  const [services, setServices] = useState<HealthSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealthSummary() {
      try {
        const data = (await apiFetch(
          "/api/observability/health-summary"
        )) as HealthSummary[];

        setServices(data);
      } finally {
        setLoading(false);
      }
    }

    loadHealthSummary();
  }, []);

  if (loading) {
    return <div className="p-6">Loading observability data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Observability</h1>
        <p className="text-sm text-zinc-500">
          Runtime health, latency, errors, pod restarts, and replica status.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          No health snapshots found yet. Create a manual health snapshot from
          the backend to populate this page.
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={`${service.service_id}-${service.environment}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-medium">
                      {service.service_name}
                    </h2>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                        service.status
                      )}`}
                    >
                      {service.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {service.environment} · {service.service_id}
                  </p>
                </div>

                <Link
                  href={`/services/${service.service_id}/health`}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  View health
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <Metric
                  label="Latency"
                  value={
                    service.latency_ms !== null &&
                    service.latency_ms !== undefined
                      ? `${service.latency_ms} ms`
                      : "N/A"
                  }
                />

                <Metric
                  label="Error Rate"
                  value={
                    service.error_rate !== null &&
                    service.error_rate !== undefined
                      ? `${service.error_rate}%`
                      : "N/A"
                  }
                />

                <Metric
                  label="Pod Restarts"
                  value={String(service.pod_restart_count ?? "N/A")}
                />

                <Metric
                  label="Available Replicas"
                  value={String(service.available_replicas ?? "N/A")}
                />

                <Metric
                  label="Desired Replicas"
                  value={String(service.replica_count ?? "N/A")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}