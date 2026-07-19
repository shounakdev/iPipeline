"use client";

import { useState } from "react";

import {
  formatIncidentDate,
  formatOperatorName,
} from "@/lib/incident-format";
import { assignIncident } from "@/lib/incidents-api";
import type {
  IncidentAssignment,
  IncidentStatus,
} from "@/types/incidents";

type IncidentAssignmentPanelProps = {
  incidentId: string;
  status: IncidentStatus;
  currentAssignment: IncidentAssignment | null;
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
};

export function IncidentAssignmentPanel({
  incidentId,
  status,
  currentAssignment,
  canEdit,
  onChanged,
}: IncidentAssignmentPanelProps) {
  const [assignedToUserId, setAssignedToUserId] =
    useState(
      currentAssignment?.assigned_to_user_id ?? "",
    );

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const currentAssignee =
    currentAssignment?.assigned_to_user;

  const handleAssign = async () => {
    const userId = assignedToUserId.trim();

    if (!userId) {
      setError("An operator user ID is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await assignIncident(incidentId, {
        assigned_to_user_id: userId,
        note: note.trim() || null,
      });

      setNote("");
      await onChanged();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "Unable to assign incident.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Assignment
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Current ownership and operator assignment.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Current operator
          </p>

          <p className="mt-2 font-semibold text-slate-950 dark:text-slate-100">
            {currentAssignment
              ? formatOperatorName(currentAssignee)
              : "Unassigned"}
          </p>

          {currentAssignment ? (
            <>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Assigned{" "}
                {formatIncidentDate(
                  currentAssignment.assigned_at,
                )}
              </p>

              {currentAssignment.assignment_note ? (
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  {currentAssignment.assignment_note}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        {canEdit && status !== "RESOLVED" ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Operator user ID
              </span>

              <input
                value={assignedToUserId}
                onChange={(event) =>
                  setAssignedToUserId(
                    event.target.value,
                  )
                }
                placeholder="Enter operator user ID"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Assignment note
              </span>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                maxLength={5000}
                rows={3}
                placeholder="Optional assignment context"
                className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            {error ? (
              <p className="text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                void handleAssign();
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Assigning…"
                : "Assign incident"}
            </button>
          </div>
        ) : null}

        {!canEdit ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You have read-only access to incident
            assignments.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default IncidentAssignmentPanel;
