"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type TimelineEvent = {
  event_id: string;
  event_type: string;
  topic: string;
  timestamp?: string | null;
  processing_status: string;
  payload: Record<string, unknown>;
};

type TimelineResponse = {
  events: TimelineEvent[];
};

export default function ReleaseTimelinePage() {
  const params = useParams();
  const correlationId = params.correlationId as string;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!correlationId) return;

    let cancelled = false;

    async function loadTimeline() {
      setLoading(true);

      try {
        const data = await apiFetch<TimelineResponse>(
          `/api/releases/${correlationId}/timeline`
        );

        if (!cancelled) {
          setEvents(data.events || []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadTimeline();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [correlationId]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Release Timeline</h1>
        <p className="text-sm text-gray-500 break-all">{correlationId}</p>
      </div>

      <section className="rounded-xl border p-4">
        {loading && <p className="text-sm text-gray-500">Loading timeline...</p>}

        {!loading && events.length === 0 && (
          <p className="text-sm text-gray-500">
            No events found for this correlation ID.
          </p>
        )}

        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.event_id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full border" />
                {index < events.length - 1 && (
                  <div className="h-full min-h-10 border-l" />
                )}
              </div>

              <div className="pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/events/${event.event_id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {event.event_type}
                  </Link>

                  <span className="rounded-full border px-2 py-1 text-xs">
                    {event.processing_status}
                  </span>

                  <span className="text-xs text-gray-500">{event.topic}</span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {event.timestamp
                    ? new Date(event.timestamp).toLocaleString()
                    : "No timestamp"}
                </p>

                <pre className="mt-2 max-w-3xl overflow-auto rounded-md border p-3 text-xs">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
