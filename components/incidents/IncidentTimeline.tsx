import Link from "next/link";

import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import {
  formatIdentifier,
  formatIncidentDate,
  formatIncidentEventType,
  formatOperatorName,
} from "@/lib/incident-format";
import type {
  IncidentTimelineEvent,
  IncidentTimelineResponse,
} from "@/types/incidents";

type IncidentTimelineProps = {
  timeline: IncidentTimelineResponse;
};

function sortTimelineEvents(
  events: IncidentTimelineEvent[],
): IncidentTimelineEvent[] {
  return [...events].sort(
    (left, right) =>
      new Date(left.occurred_at).getTime() -
      new Date(right.occurred_at).getTime(),
  );
}

function TimelineRelationship({
  event,
}: {
  event: IncidentTimelineEvent;
}) {
  const alertId =
    event.alert?.alert_id ??
    event.alert?.id ??
    event.alert_id;

  const deploymentId =
    event.deployment?.deployment_id ??
    event.deployment?.id ??
    event.deployment_id;

  if (!alertId && !deploymentId) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {alertId ? (
        <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          Alert: {formatIdentifier(alertId)}
        </span>
      ) : null}

      {deploymentId ? (
        <Link
          href={`/deployments/${deploymentId}`}
          className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-blue-700 hover:underline dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
        >
          Deployment:{" "}
          {formatIdentifier(deploymentId)}
        </Link>
      ) : null}
    </div>
  );
}

export function IncidentTimeline({
  timeline,
}: IncidentTimelineProps) {
  const events = sortTimelineEvents(
    timeline.events ?? [],
  );

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Incident timeline
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Events are displayed in chronological order.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="m-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          No timeline events have been recorded.
        </div>
      ) : (
        <ol className="px-5 py-5">
          {events.map((event, index) => (
            <li
              key={event.id}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {index < events.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-5 h-[calc(100%-0.5rem)] w-px bg-slate-300 dark:bg-slate-700"
                />
              ) : null}

              <span
                aria-hidden="true"
                className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-blue-100 bg-blue-600 dark:border-blue-950 dark:bg-blue-400"
              />

              <article className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-slate-100">
                      {formatIncidentEventType(
                        event.event_type,
                      )}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Source: {event.source}
                    </p>
                  </div>

                  <time className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {formatIncidentDate(
                      event.occurred_at,
                    )}
                  </time>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {event.message ??
                    "No event message was recorded."}
                </p>

                {event.from_status &&
                event.to_status ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <IncidentStatusBadge
                      status={event.from_status}
                    />

                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      →
                    </span>

                    <IncidentStatusBadge
                      status={event.to_status}
                    />
                  </div>
                ) : null}

                <TimelineRelationship event={event} />

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Actor:{" "}
                  {formatOperatorName(event.actor)}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default IncidentTimeline;
