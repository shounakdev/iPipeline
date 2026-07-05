"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Incident = {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  service_id: string;
  environment: string;
  correlation_id?: string | null;
  triggered_by_event_id?: string | null;
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
    if (Array.isArray(record.events)) return record.events as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }

  return [];
}

async function fetchIncidentData(incidentId: string) {
  const [rawIncidentData, rawTimelineData] = await Promise.all([
    apiFetch(`/api/incidents/${incidentId}`),
    apiFetch(`/api/incidents/${incidentId}/timeline`),
  ]);

  return {
    incident: rawIncidentData as Incident,
    timeline: normalizeArray<TimelineItem>(rawTimelineData),
  };
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
    case "OPEN":
      return "bg-red-100 text-red-700 border-red-200";
    case "ACKNOWLEDGED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "FALSE_POSITIVE":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
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

export default function IncidentDetailPage() {
  const params = useParams<{ incidentId: string }>();
  const incidentId = params.incidentId;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshIncident() {
    if (!incidentId) return;

    const data = await fetchIncidentData(incidentId);

    setIncident(data.incident);
    setTimeline(data.timeline);
    setError(null);
  }

  useEffect(() => {
    if (!incidentId) return;

    let cancelled = false;

    fetchIncidentData(incidentId)
      .then((data) => {
        if (cancelled) return;

        setIncident(data.incident);
        setTimeline(data.timeline);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error(err);
        setError(
          "Failed to load incident. Check that the backend is running and the incident routes are registered."
        );
      })
      .finally(() => {
        if (cancelled) return;

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  async function acknowledgeIncident() {
    if (!incidentId) return;

    try {
      setActionLoading(true);

      await apiFetch(`/api/incidents/${incidentId}/acknowledge`, {
        method: "POST",
      });

      await refreshIncident();
    } finally {
      setActionLoading(false);
    }
  }

  async function resolveIncident() {
    if (!incidentId) return;

    try {
      setActionLoading(true);

      await apiFetch(`/api/incidents/${incidentId}/resolve`, {
        method: "POST",
      });

      await refreshIncident();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading incident...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/incidents"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Incidents
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/incidents"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Incidents
        </Link>

        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          Incident not found.
        </div>
      </div>
    );
  }

  const canAcknowledge = incident.status === "OPEN";
  const canResolve =
    incident.status === "OPEN" || incident.status === "ACKNOWLEDGED";

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/incidents"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Incidents
        </Link>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{incident.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {incident.environment} · {incident.service_id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClass(
                incident.severity
              )}`}
            >
              {incident.severity}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                incident.status
              )}`}
            >
              {incident.status}
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Incident Summary</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info label="Description" value={incident.description || "N/A"} />
          <Info label="Correlation ID" value={incident.correlation_id || "N/A"} />
          <Info
            label="Triggered By Event"
            value={incident.triggered_by_event_id || "N/A"}
          />
          <Info
            label="Started At"
            value={new Date(incident.started_at).toLocaleString()}
          />
          <Info
            label="Resolved At"
            value={
              incident.resolved_at
                ? new Date(incident.resolved_at).toLocaleString()
                : "N/A"
            }
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            disabled={!canAcknowledge || actionLoading}
            onClick={acknowledgeIncident}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
          >
            Acknowledge
          </button>

          <button
            disabled={!canResolve || actionLoading}
            onClick={resolveIncident}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Resolve
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Incident Timeline</h2>

        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No timeline events found for this incident.
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}