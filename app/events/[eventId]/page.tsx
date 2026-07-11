"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type EventRecord = {
  event_id: string;

  event_type?: string | null;
  type?: string | null;
  topic?: string | null;

  service_id?: string | null;
  service?: string | null;
  service_name?: string | null;

  environment?: string | null;
  severity?: string | null;

  correlation_id?: string | null;
  correlationId?: string | null;

  timestamp?: string | null;
  created_at?: string | null;
  received_at?: string | null;

  processed?: boolean;
  processing_status?: string | null;
  processing_error?: string | null;

  payload?: Record<string, unknown> | null;
  raw_event?: Record<string, unknown> | null;
};

const formatLabel = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }

  const readableText = value.toLowerCase().replaceAll("_", " ");

  return readableText.charAt(0).toUpperCase() + readableText.slice(1);
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getSeverityClasses = (severity?: string | null) => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
    case "ERROR":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "WARNING":
    case "WARN":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    case "INFO":
    case "INFORMATIONAL":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  }
};

const getProcessingStatusClasses = (status?: string | null) => {
  switch (status?.toUpperCase()) {
    case "PROCESSED":
    case "COMPLETED":
    case "SUCCESS":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "FAILED":
    case "ERROR":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "PENDING":
    case "PROCESSING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  }
};

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<EventRecord>(
          `/api/events/${encodeURIComponent(eventId)}`
        );

        if (!cancelled) {
          setEvent(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setEvent(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the event."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadEvent();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [eventId]);

  if (loading) {
    return (
      <main className="space-y-6">
        <BackLink />

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
          Loading event...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <BackLink />

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <h1 className="font-semibold text-red-400">
            Unable to load event
          </h1>

          <p className="mt-2 text-sm text-red-300">{error}</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="space-y-6">
        <BackLink />

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="font-semibold text-white">Event not found</h1>

          <p className="mt-2 text-sm text-slate-400">
            The requested event could not be found.
          </p>
        </div>
      </main>
    );
  }

  const eventType = event.event_type ?? event.type;

  const service =
    event.service ??
    event.service_name ??
    event.service_id ??
    "Not available";

  const correlationId =
    event.correlation_id ??
    event.correlationId ??
    "Not available";

  const timestamp =
    event.timestamp ??
    event.created_at ??
    event.received_at;

  const processingStatus =
    event.processing_status ??
    (event.processed === true
      ? "PROCESSED"
      : event.processed === false
        ? "PENDING"
        : "Not available");

  return (
    <main className="space-y-6">
      <BackLink />

      <div>
        <h1 className="text-2xl font-bold text-white">
          Event Details
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Inspect the event metadata, processing state and payload.
        </p>

        <code className="mt-2 block break-all text-xs text-slate-500">
          {event.event_id}
        </code>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Event Type"
          value={formatLabel(eventType)}
        />

        <DetailField
          label="Topic"
          value={event.topic ?? "Not available"}
        />

        <DetailField
          label="Service"
          value={service}
        />

        <DetailField
          label="Environment"
          value={formatLabel(event.environment)}
        />

        <DetailField
          label="Severity"
          value={
            event.severity ? (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                  event.severity
                )}`}
              >
                {formatLabel(event.severity)}
              </span>
            ) : (
              "Not available"
            )
          }
        />

        <DetailField
          label="Correlation ID"
          value={
            <code className="break-all text-xs text-blue-300">
              {correlationId}
            </code>
          }
        />

        <DetailField
          label="Processing Status"
          value={
            processingStatus === "Not available" ? (
              "Not available"
            ) : (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getProcessingStatusClasses(
                  processingStatus
                )}`}
              >
                {formatLabel(processingStatus)}
              </span>
            )
          }
        />

        <DetailField
          label="Timestamp"
          value={formatTimestamp(timestamp)}
        />
      </section>

      {event.processing_error && (
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <h2 className="font-semibold text-red-400">
            Processing Error
          </h2>

          <p className="mt-2 break-words text-sm text-red-300">
            {event.processing_error}
          </p>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            Payload
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Structured data submitted with this event.
          </p>
        </div>

        <pre className="max-h-[400px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-300">
          {JSON.stringify(event.payload ?? {}, null, 2)}
        </pre>
      </section>

      <details className="rounded-xl border border-slate-800 bg-slate-900">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-white">
          Raw Event
        </summary>

        <div className="border-t border-slate-800 p-5">
          <pre className="max-h-[500px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-300">
            {JSON.stringify(event.raw_event ?? event, null, 2)}
          </pre>
        </div>
      </details>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/events"
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
    >
      <span aria-hidden="true">←</span>
      Back to Event Explorer
    </Link>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 break-words text-sm font-medium text-slate-100">
        {value ?? "Not available"}
      </div>
    </div>
  );
}