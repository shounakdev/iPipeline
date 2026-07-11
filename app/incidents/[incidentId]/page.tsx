
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

type Incident = {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: IncidentStatus | string;
  service_id: string;
  environment: string;
  correlation_id?: string | null;
  triggered_by_event_id?: string | null;
  started_at: string;
  resolved_at?: string | null;
};

type TimelinePayload = Record<string, unknown> & {
  event_type?: string | null;
};

type TimelineItem = {
  id?: string | null;
  event_id?: string | null;
  timestamp?: string | null;
  created_at?: string | null;
  source?: string | null;
  event_type?: string | null;
  eventType?: string | null;
  type?: string | null;
  action?: string | null;
  title?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: TimelinePayload | null;
  payload?: TimelinePayload | null;
};

const INCIDENT_EVENT_LABELS: Record<string, string> = {
  HEALTH_SNAPSHOT_RECORDED: "Health snapshot recorded",
  HIGH_ERROR_RATE: "High error rate detected",
  HIGH_LATENCY: "High latency detected",
  POD_RESTART_SPIKE: "Pod restart spike detected",
  POD_RESTARTS: "Pod restarts detected",
  REPLICA_UNAVAILABLE: "Replica availability degraded",
  SERVICE_DEGRADED: "Service degraded",
  INCIDENT_CREATED: "Incident created",
  INCIDENT_ACKNOWLEDGED: "Incident acknowledged",
  INCIDENT_RESOLVED: "Incident resolved",
  INCIDENT_ESCALATED: "Incident escalated",
};

const getStatusBadgeClasses = (status?: string | null) => {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "ACKNOWLEDGED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    case "RESOLVED":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  }
};

const humanizeEventType = (eventType?: string | null) => {
  if (!eventType) {
    return "Incident event";
  }

  const normalizedType = eventType.toUpperCase();

  if (INCIDENT_EVENT_LABELS[normalizedType]) {
    return INCIDENT_EVENT_LABELS[normalizedType];
  }

  const readableText = normalizedType.toLowerCase().replaceAll("_", " ");

  return readableText.charAt(0).toUpperCase() + readableText.slice(1);
};

const getTimelineEventType = (event: TimelineItem) => {
  return (
    event.event_type ??
    event.eventType ??
    event.type ??
    event.action ??
    event.metadata?.event_type ??
    event.payload?.event_type ??
    null
  );
};

const getTimelineTimestamp = (event: TimelineItem) => {
  return event.timestamp ?? event.created_at ?? null;
};

const getTimelineDetails = (event: TimelineItem) => {
  return event.details ?? event.payload ?? event.metadata ?? null;
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

function timelineIcon(item: TimelineItem) {
  const eventType = getTimelineEventType(item)?.toUpperCase();
  const source = item.source?.toLowerCase();

  if (eventType === "INCIDENT_RESOLVED") return "✅";
  if (eventType === "INCIDENT_ACKNOWLEDGED") return "👀";
  if (eventType === "INCIDENT_CREATED") return "🚨";
  if (eventType === "INCIDENT_ESCALATED") return "🔥";
  if (eventType === "HIGH_ERROR_RATE") return "📉";
  if (eventType === "HIGH_LATENCY") return "🐢";
  if (eventType === "POD_RESTARTS") return "🔁";
  if (eventType === "POD_RESTART_SPIKE") return "🔁";
  if (eventType === "REPLICA_UNAVAILABLE") return "⚠️";
  if (eventType === "SERVICE_DEGRADED") return "⚠️";
  if (eventType === "HEALTH_SNAPSHOT_RECORDED") return "📈";
  if (source === "service_health_snapshots") return "📈";

  return "•";
}

function severityClass(severity: string) {
  switch (severity?.toUpperCase()) {
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
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
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
      setIsAcknowledging(true);

      await apiFetch(`/api/incidents/${incidentId}/acknowledge`, {
        method: "POST",
      });

      await refreshIncident();
    } finally {
      setIsAcknowledging(false);
    }
  }

  async function resolveIncident() {
    if (!incidentId) return;

    try {
      setIsResolving(true);

      await apiFetch(`/api/incidents/${incidentId}/resolve`, {
        method: "POST",
      });

      await refreshIncident();
    } finally {
      setIsResolving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading incident...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
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
      <div className="space-y-4 p-6">
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

  const normalizedStatus = incident.status?.toUpperCase();

  const acknowledgeDisabled =
    normalizedStatus === "ACKNOWLEDGED" || normalizedStatus === "RESOLVED";

  const resolveDisabled = normalizedStatus === "RESOLVED";

  return (
    <div className="space-y-6 p-6">
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
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={acknowledgeIncident}
            disabled={acknowledgeDisabled || isAcknowledging || isResolving}
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold transition
              ${
                acknowledgeDisabled || isResolving
                  ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-60"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400"
              }
            `}
          >
            {isAcknowledging ? "Acknowledging..." : "Acknowledge"}
          </button>

          <button
            type="button"
            onClick={resolveIncident}
            disabled={resolveDisabled || isResolving || isAcknowledging}
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold transition
              ${
                resolveDisabled || isAcknowledging
                  ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-60"
                  : "bg-green-500 text-slate-950 hover:bg-green-400"
              }
            `}
          >
            {isResolving ? "Resolving..." : "Resolve"}
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
            {timeline.map((item, index) => {
              const eventType = getTimelineEventType(item);
              const eventTitle = humanizeEventType(eventType);
              const eventTimestamp = getTimelineTimestamp(item);
              const eventDetails = getTimelineDetails(item);

              return (
                <div
                  key={
                    item.id ??
                    item.event_id ??
                    `${eventTimestamp ?? "unknown"}-${
                      eventType ?? "incident-event"
                    }-${index}`
                  }
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-900">
                        {timelineIcon(item)}
                      </div>

                      <div>
                        <p className="font-medium">{eventTitle}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Incident event
                        </p>
                      </div>
                    </div>

                    <time className="text-xs text-zinc-500">
                      {eventTimestamp
                        ? new Date(eventTimestamp).toLocaleString()
                        : "Timestamp unavailable"}
                    </time>
                  </div>

                  {eventDetails && Object.keys(eventDetails).length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        View metadata
                      </summary>

                      <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                        {JSON.stringify(eventDetails, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
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