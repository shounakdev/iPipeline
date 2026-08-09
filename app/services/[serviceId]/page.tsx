"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type HealthSummary = {
  service_id: string;
  service_name: string;
  environment: string;
  status: string;
  latency_ms?: number | null;
  error_rate?: number | null;
  pod_restart_count?: number | null;
  replica_count?: number | null;
  available_replicas?: number | null;
  created_at?: string | null;
};

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  service_id: string;
  environment: string;
  started_at: string;
  resolved_at?: string | null;
};

type IncidentListResponse = {
  incidents?: Incident[];
  items?: Incident[];
  results?: Incident[];
  data?: Incident[];
};

type TimelineItem = {
  timestamp: string;
  source: string;
  event_type: string;
  title: string;
  details: Record<string, unknown>;
};

type TimelineResponse = {
  timeline?: TimelineItem[];
  events?: TimelineItem[];
  items?: TimelineItem[];
  results?: TimelineItem[];
  data?: TimelineItem[];
};

function statusClass(status: string) {
  switch (status) {
    case "HEALTHY":
      return "bg-green-100 text-green-700 border-green-200";
    case "DEGRADED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "UNHEALTHY":
      return "bg-red-100 text-red-700 border-red-200";
    case "OPEN":
      return "bg-red-100 text-red-700 border-red-200";
    case "ACKNOWLEDGED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function asIncidentArray(data: unknown): Incident[] {
  if (Array.isArray(data)) {
    return data as Incident[];
  }

  if (data && typeof data === "object") {
    const response = data as IncidentListResponse;

    if (Array.isArray(response.incidents)) {
      return response.incidents;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.results)) {
      return response.results;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }
  }

  return [];
}

function asTimelineArray(data: unknown): TimelineItem[] {
  if (Array.isArray(data)) {
    return data as TimelineItem[];
  }

  if (data && typeof data === "object") {
    const response = data as TimelineResponse;

    if (Array.isArray(response.timeline)) {
      return response.timeline;
    }

    if (Array.isArray(response.events)) {
      return response.events;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.results)) {
      return response.results;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }
  }

  return [];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load service health.";
}

export default function ServiceHealthPage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadServiceHealth() {
      const [healthResult, incidentsResult, timelineResult] =
        await Promise.allSettled([
          apiFetch(`/api/observability/services/${serviceId}/health`),
          apiFetch(`/api/services/${serviceId}/incidents`),
          apiFetch(`/api/services/${serviceId}/runtime-timeline`),
        ]);

      if (cancelled) return;

      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value as HealthSummary);
      } else {
        setHealth(null);
        setError(getErrorMessage(healthResult.reason));
      }

      setIncidents(
        incidentsResult.status === "fulfilled"
          ? asIncidentArray(incidentsResult.value)
          : [],
      );

      setTimeline(
        timelineResult.status === "fulfilled"
          ? asTimelineArray(timelineResult.value)
          : [],
      );

      setLoading(false);
    }

    if (!serviceId) return;

    void loadServiceHealth();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  if (loading) {
    return <div className="p-6">Loading service health...</div>;
  }

  if (!health) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/services"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Services
        </Link>

        <h1 className="text-2xl font-semibold">Service Health</h1>

        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {error?.includes("No health snapshot found")
            ? "No health snapshot has been recorded for this service yet."
            : error ?? "No health snapshot found for this service."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/observability"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Observability
        </Link>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{health.service_name}</h1>

            <p className="text-sm text-zinc-500">
              {health.environment} · {health.service_id}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                health.status,
              )}`}
            >
              {health.status}
            </span>

            <Link
              href={`/services/${health.service_id}/reliability`}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              View Reliability
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric
          label="Latency"
          value={
            health.latency_ms !== null && health.latency_ms !== undefined
              ? `${health.latency_ms} ms`
              : "N/A"
          }
        />

        <Metric
          label="Error Rate"
          value={
            health.error_rate !== null && health.error_rate !== undefined
              ? `${health.error_rate}%`
              : "N/A"
          }
        />

        <Metric
          label="Pod Restarts"
          value={String(health.pod_restart_count ?? "N/A")}
        />

        <Metric
          label="Available Replicas"
          value={String(health.available_replicas ?? "N/A")}
        />

        <Metric
          label="Desired Replicas"
          value={String(health.replica_count ?? "N/A")}
        />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Related Incidents</h2>

        {incidents.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No incidents found for this service.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="block rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-medium">{incident.title}</h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Started {new Date(incident.started_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                        incident.severity,
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                        incident.status,
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Runtime Timeline</h2>

        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No runtime timeline events found yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {timeline.map((item, index) => (
              <div
                key={`${item.timestamp}-${item.event_type}-${index}`}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {item.source} · {item.event_type}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>

                {item.details && Object.keys(item.details).length > 0 && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify(item.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}