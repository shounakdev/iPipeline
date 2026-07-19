"use client";

import { useState } from "react";

import {
  acknowledgeIncident,
  updateIncidentStatus,
} from "@/lib/incidents-api";
import {
  getIncidentStatusActions,
  type IncidentStatusAction,
} from "@/lib/incident-status";
import type {
  IncidentStatus,
} from "@/types/incidents";

type IncidentActionsProps = {
  incidentId: string;
  status: IncidentStatus;
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
};

const actionToneClasses = {
  primary:
    "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500",

  warning:
    "border-orange-600 bg-orange-600 text-white hover:bg-orange-700 dark:border-orange-500 dark:bg-orange-600 dark:hover:bg-orange-500",

  success:
    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500",

  danger:
    "border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500",
} as const;

export function IncidentActions({
  incidentId,
  status,
  canEdit,
  onChanged,
}: IncidentActionsProps) {
  const [selectedAction, setSelectedAction] =
    useState<IncidentStatusAction | null>(null);

  const [reason, setReason] = useState("");
  const [assignToSelf, setAssignToSelf] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  if (!canEdit) {
    return null;
  }

  const actions = getIncidentStatusActions(status);

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        This incident has no remaining status actions.
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedAction) {
      return;
    }

    const normalizedReason = reason.trim();

    if (
      selectedAction.kind === "status" &&
      !normalizedReason
    ) {
      setError(
        "A reason is required for status changes.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (selectedAction.kind === "acknowledge") {
        await acknowledgeIncident(incidentId, {
          note: normalizedReason || null,
          assign_to_self: assignToSelf,
        });
      } else {
        await updateIncidentStatus(incidentId, {
          status: selectedAction.targetStatus,
          reason: normalizedReason,
        });
      }

      setSelectedAction(null);
      setReason("");
      setAssignToSelf(false);

      await onChanged();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update incident.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3 lg:max-w-lg">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.targetStatus}
            type="button"
            disabled={submitting}
            onClick={() => {
              setSelectedAction(action);
              setReason("");
              setError(null);
            }}
            className={[
              "rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
              actionToneClasses[action.tone],
            ].join(" ")}
          >
            {action.label}
          </button>
        ))}
      </div>

      {selectedAction ? (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                {selectedAction.label}
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedAction.kind === "acknowledge"
                  ? "Add an optional acknowledgement note."
                  : "Record the reason for this status change."}
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setSelectedAction(null);
                setReason("");
                setError(null);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Cancel
            </button>
          </div>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            maxLength={5000}
            rows={3}
            placeholder={
              selectedAction.kind === "acknowledge"
                ? "Acknowledgement note (optional)"
                : "Reason for status change"
            }
            className="mt-3 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          {selectedAction.kind === "acknowledge" ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={assignToSelf}
                onChange={(event) =>
                  setAssignToSelf(
                    event.target.checked,
                  )
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              Assign incident to me
            </label>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void handleSubmit();
            }}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Updating…"
              : `Confirm ${selectedAction.label}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default IncidentActions;
