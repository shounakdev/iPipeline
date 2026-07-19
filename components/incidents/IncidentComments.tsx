"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  formatIncidentDate,
  formatOperatorName,
} from "@/lib/incident-format";
import { createIncidentComment } from "@/lib/incidents-api";
import type { IncidentComment } from "@/types/incidents";

type IncidentCommentsProps = {
  incidentId: string;
  comments: IncidentComment[];
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
};

export function IncidentComments({
  incidentId,
  comments,
  canEdit,
  onChanged,
}: IncidentCommentsProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (left, right) =>
          new Date(left.created_at).getTime() -
          new Date(right.created_at).getTime(),
      ),
    [comments],
  );

  const handleSubmit = async () => {
    const normalizedComment = comment.trim();

    if (!normalizedComment) {
      setError("Comment cannot be blank.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createIncidentComment(incidentId, {
        comment: normalizedComment,
      });

      setComment("");
      await onChanged();
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Unable to add comment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Comments
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Operational notes recorded during the incident.
        </p>
      </div>

      {canEdit ? (
        <div className="border-b border-slate-200 p-5 dark:border-slate-700">
          <label className="block">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Add comment
            </span>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              maxLength={10000}
              rows={4}
              placeholder="Record an operational update"
              className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          {error ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void handleSubmit();
            }}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Adding comment…"
              : "Add comment"}
          </button>
        </div>
      ) : null}

      {sortedComments.length === 0 ? (
        <div className="m-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          No comments have been recorded.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {sortedComments.map((item) => (
            <article
              key={item.id}
              className="p-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {formatOperatorName(item.author)}
                </p>

                <time className="text-xs text-slate-500 dark:text-slate-400">
                  {formatIncidentDate(
                    item.created_at,
                  )}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                {item.comment}
              </p>
            </article>
          ))}
        </div>
      )}

      {!canEdit ? (
        <p className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          You have read-only access to incident comments.
        </p>
      ) : null}
    </section>
  );
}

export default IncidentComments;
