"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type EventRecord = {
  event_id: string;
  event_type: string;
  topic: string;
  service_id?: string | null;
  environment?: string | null;
  correlation_id?: string | null;
  timestamp?: string | null;
  processing_status: string;
  processing_error?: string | null;
  payload: Record<string, unknown>;
  raw_event: Record<string, unknown>;
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!eventId) return;

  let cancelled = false;

  async function loadEvent() {
    setLoading(true);

    try {
      const data = await apiFetch<EventRecord>(`/api/events/${eventId}`);

      if (!cancelled) {
        setEvent(data);
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
    return <main>Loading event...</main>;
  }

  if (!event) {
    return <main>Event not found.</main>;
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{event.event_type}</h1>
        <p className="text-sm text-gray-500">{event.event_id}</p>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="mb-4 font-medium">Metadata</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Info label="Topic" value={event.topic} />
          <Info label="Service" value={event.service_id || "-"} />
          <Info label="Environment" value={event.environment || "-"} />
          <Info label="Correlation ID" value={event.correlation_id || "-"} />
          <Info
            label="Timestamp"
            value={event.timestamp ? new Date(event.timestamp).toLocaleString() : "-"}
          />
          <Info label="Processing Status" value={event.processing_status} />
        </div>

        {event.processing_error && (
          <div className="mt-4 rounded-md border p-3 text-sm">
            <p className="font-medium">Processing Error</p>
            <p>{event.processing_error}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-4 font-medium">Payload</h2>
        <pre className="overflow-auto rounded-md border p-4 text-xs">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-4 font-medium">Raw Event</h2>
        <pre className="overflow-auto rounded-md border p-4 text-xs">
          {JSON.stringify(event.raw_event, null, 2)}
        </pre>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}
