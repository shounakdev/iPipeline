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

const GRAFANA_URL =
  process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3002";

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

type TimelineItem = {
  timestamp: string;
  source: string;
  event_type: string;
  title: string;
  details: Record<string, unknown>;
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.timeline)) return record.timeline as T[];
    if (Array.isArray(record.incidents)) return record.incidents as T[];
    if (Array.isArray(record.events)) return record.events as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }

  return [];
}

function formatLabel(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function timelineTitle(item: TimelineItem) {
  const eventType = item.event_type?.toUpperCase();
  const source = item.source?.toLowerCase();

  switch (eventType) {
    case "INCIDENT_CREATED":
      return "Incident created";
    case "INCIDENT_ACKNOWLEDGED":
      return "Incident acknowledged";
    case "INCIDENT_RESOLVED":
      return "Incident resolved";
    case "INCIDENT_ESCALATED":
      return "Incident escalated";
    case "HIGH_ERROR_RATE":
      return "High error rate detected";
    case "HIGH_LATENCY":
      return "High latency detected";
    case "POD_RESTARTS":
      return "Pod restarts detected";
    case "REPLICA_UNAVAILABLE":
      return "Replica availability degraded";
    default:
      if (source === "service_health_snapshots") {
        return "Health snapshot recorded";
      }

      if (source === "incident_events") {
        return formatLabel(item.event_type || item.title);
      }

      return item.title || formatLabel(item.event_type || item.source);
  }
}

function timelineSubtitle(item: TimelineItem) {
  const source = formatLabel(item.source);
  const eventType = formatLabel(item.event_type);

  return `${source} · ${eventType}`;
}

function timelineIcon(item: TimelineItem) {
  const eventType = item.event_type?.toUpperCase();
  const source = item.source?.toLowerCase();

  if (eventType === "INCIDENT_RESOLVED") return "✅";
  if (eventType === "INCIDENT_ACKNOWLEDGED") return "👀";
  if (eventType === "INCIDENT_CREATED") return "🚨";
  if (eventType === "INCIDENT_ESCALATED") return "🔥";
  if (eventType === "HIGH_ERROR_RATE") return "📉";
  if (eventType === "HIGH_LATENCY") return "🐢";
  if (eventType === "POD_RESTARTS") return "🔁";
  if (eventType === "REPLICA_UNAVAILABLE") return "⚠️";
  if (source === "service_health_snapshots") return "📈";

  return "•";
}

function statusClass(status: string) {
  switch (status) {
    case "HEALTHY":
      return "bg-green-100 text-green-700 border-green-200";
    case "DEGRADED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "UNHEALTHY":
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

export default function ServiceHealthPage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServiceHealth() {
      try {
        setError(null);

        const [rawHealthData, rawIncidentsData, rawTimelineData] =
          await Promise.all([
            apiFetch(`/api/observability/services/${serviceId}/health`),
            apiFetch(`/api/services/${serviceId}/incidents`),
            apiFetch(`/api/services/${serviceId}/runtime-timeline`),
          ]);

        setHealth(rawHealthData as HealthSummary);
        setIncidents(normalizeArray<Incident>(rawIncidentsData));
        setTimeline(normalizeArray<TimelineItem>(rawTimelineData));
      } catch (err) {
        console.error(err);
        setError(
          "Failed to load service health. Check that the backend is running and the runtime timeline routes are registered."
        );
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) {
      loadServiceHealth();
    }
  }, [serviceId]);

  if (loading) {
    return <div className="p-6">Loading service health...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/observability"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Observability
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/observability"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Observability
        </Link>

        <h1 className="text-2xl font-semibold">Service Health</h1>

        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          No health snapshot found for this service.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/observability"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Observability
        </Link>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{health.service_name}</h1>
            <p className="text-sm text-zinc-500">
              {health.environment} · {health.service_id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
              health.status
            )}`}
          >
            {health.status}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Grafana Dashboards</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Open deep metrics dashboards for service health, backend metrics,
              and incidents.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`${GRAFANA_URL}/d/platformiq-backend/platformiq-backend`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            PlatformIQ Backend Metrics
          </a>

          <a
            href={`${GRAFANA_URL}/d/payment-service/payment-service`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Payment Service Metrics
          </a>

          <a
            href={`${GRAFANA_URL}/d/incident-overview/incident-overview`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Incident Overview Metrics
          </a>
        </div>
      </section>

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
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                        incident.status
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
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-900">
                      {timelineIcon(item)}
                    </div>

                    <div>
                      <p className="font-medium">{timelineTitle(item)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {timelineSubtitle(item)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>

                {item.details && Object.keys(item.details).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                      View metadata
                    </summary>

                    <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  </details>
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