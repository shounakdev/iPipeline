"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

type EventFilters = {
  eventType?: string;
  correlationId?: string;
  topic?: string;
  status?: string;
};

export default function EventExplorerPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventType, setEventType] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (filters: EventFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters.eventType?.trim()) {
          params.set(
            "event_type",
            filters.eventType.trim(),
          );
        }

        if (filters.correlationId?.trim()) {
          params.set(
            "correlation_id",
            filters.correlationId.trim(),
          );
        }

        if (filters.topic?.trim()) {
          params.set("topic", filters.topic.trim());
        }

        if (filters.status?.trim()) {
          params.set("status", filters.status.trim());
        }

        const query = params.toString();

        const data = await apiFetch<{
          events: EventRecord[];
        }>(
          query
            ? `/api/events?${query}`
            : "/api/events",
        );

        setEvents(data.events ?? []);
      } catch (loadError) {
        setEvents([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load events.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleApplyFilters = useCallback(() => {
    void loadEvents({
      eventType,
      correlationId,
      topic,
      status,
    });
  }, [
    correlationId,
    eventType,
    loadEvents,
    status,
    topic,
  ]);

  const handleClearFilters = useCallback(() => {
    setEventType("");
    setCorrelationId("");
    setTopic("");
    setStatus("");

    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadEvents]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Event Explorer
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Inspect PlatformIQ events across pipeline,
          deployment, Kubernetes, audit, and remediation
          flows.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="font-medium">Filters</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
            placeholder="Event type"
            value={eventType}
            onChange={(event) =>
              setEventType(event.target.value)
            }
          />

          <input
            className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
            placeholder="Correlation ID"
            value={correlationId}
            onChange={(event) =>
              setCorrelationId(event.target.value)
            }
          />

          <input
            className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
            placeholder="Topic"
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value)
            }
          />

          <input
            className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
            placeholder="Status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="font-medium">Events</h2>

          {loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </span>
          )}
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="font-medium text-red-700 dark:text-red-400">
              Could not load events
            </p>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr className="text-left">
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Topic</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3">
                    Correlation ID
                  </th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.event_id}
                    className="border-b border-gray-200 last:border-b-0 dark:border-gray-800"
                  >
                    <td className="p-3">
                      <Link
                        href={`/events/${event.event_id}`}
                        className="font-medium underline underline-offset-4"
                      >
                        {event.event_type}
                      </Link>
                    </td>

                    <td className="p-3">
                      {event.topic}
                    </td>

                    <td className="p-3">
                      {event.service_id || "-"}
                    </td>

                    <td className="p-3">
                      {event.environment || "-"}
                    </td>

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
                      {event.timestamp
                        ? new Date(
                            event.timestamp,
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      <span className="rounded-full border border-gray-300 px-2 py-1 text-xs dark:border-gray-700">
                        {event.processing_status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && events.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-gray-500 dark:text-gray-400"
                      colSpan={7}
                    >
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}