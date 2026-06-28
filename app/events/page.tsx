"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  payload: Record<string, unknown>;
};

export default function EventExplorerPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventType, setEventType] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadEvents() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (eventType) params.set("event_type", eventType);
      if (correlationId) params.set("correlation_id", correlationId);
      if (topic) params.set("topic", topic);
      if (status) params.set("status", status);

      const data = await apiFetch<{ events: EventRecord[] }>(
        `/api/events?${params.toString()}`
      );

      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadEvents();
  }, 0);

  return () => window.clearTimeout(timer);
}, []);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Event Explorer</h1>
        <p className="text-sm text-gray-500">
          Inspect PlatformIQ events across pipeline, deployment, Kubernetes, audit, and remediation flows.
        </p>
      </div>

      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="font-medium">Filters</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Event type"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          />

          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Correlation ID"
            value={correlationId}
            onChange={(event) => setCorrelationId(event.target.value)}
          />

          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />

          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadEvents}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>

          <button
            onClick={() => {
              setEventType("");
              setCorrelationId("");
              setTopic("");
              setStatus("");
              setTimeout(loadEvents, 0);
            }}
            className="rounded-md border px-4 py-2"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="font-medium">Events</h2>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3">Event Type</th>
                <th className="p-3">Topic</th>
                <th className="p-3">Service</th>
                <th className="p-3">Environment</th>
                <th className="p-3">Correlation ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr key={event.event_id} className="border-b">
                  <td className="p-3">
                    <Link
                      href={`/events/${event.event_id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {event.event_type}
                    </Link>
                  </td>

                  <td className="p-3">{event.topic}</td>
                  <td className="p-3">{event.service_id || "-"}</td>
                  <td className="p-3">{event.environment || "-"}</td>

                  <td className="p-3">
                    {event.correlation_id ? (
                      <Link
                        href={`/releases/${event.correlation_id}/timeline`}
                        className="underline underline-offset-4"
                      >
                        {event.correlation_id}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-3">
                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : "-"}
                  </td>

                  <td className="p-3">
                    <span className="rounded-full border px-2 py-1 text-xs">
                      {event.processing_status}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && events.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={7}>
                    No events found.
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
