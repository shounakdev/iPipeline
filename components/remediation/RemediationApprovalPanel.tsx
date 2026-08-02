"use client";

import { useState } from "react";
import {
  formatRemediationDate,
} from "@/lib/remediation-format";
import type {
  RemediationDetail,
} from "@/types/remediation";
import { RemediationStatusBadge } from "./RemediationStatusBadge";

export type RemediationActionName =
  | "approve"
  | "reject"
  | "execute"
  | "verify";

type RemediationApprovalPanelProps = {
  remediation: RemediationDetail;
  canManage: boolean;
  busyAction: RemediationActionName | null;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onExecute: () => void;
  onVerify: () => void;
};

export function RemediationApprovalPanel({
  remediation,
  canManage,
  busyAction,
  onApprove,
  onReject,
  onExecute,
  onVerify,
}: RemediationApprovalPanelProps) {
  const [showRejectionForm, setShowRejectionForm] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const isBusy = busyAction !== null;

  const canDecide =
    remediation.status === "PENDING_APPROVAL";

  const canExecute =
    remediation.status === "APPROVED" &&
    remediation.approval?.decision === "APPROVED";

  const canVerify =
    remediation.status === "COMPLETED" &&
    remediation.execution?.execution_status ===
      "SUCCEEDED";

  function submitRejection(): void {
    const cleanedReason = rejectionReason.trim();

    if (!cleanedReason) {
      return;
    }

    onReject(cleanedReason);
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Approval and guarded actions
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Human approval is required before any
            remediation command can execute.
          </p>
        </div>

        <RemediationStatusBadge
          status={remediation.status}
        />
      </div>

      <div className="space-y-5 p-5">
        {remediation.approval ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Operator decision
              </h3>

              <RemediationStatusBadge
                status={
                  remediation.approval.decision
                }
              />
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Decided by
                </dt>

                <dd className="mt-1 break-all text-sm text-slate-800 dark:text-slate-200">
                  {remediation.approval.approved_by ??
                    "Unknown operator"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Decision time
                </dt>

                <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {formatRemediationDate(
                    remediation.approval.approved_at,
                  )}
                </dd>
              </div>
            </dl>

            {remediation.approval
              .rejection_reason ? (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Rejection reason
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                  {
                    remediation.approval
                      .rejection_reason
                  }
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            This recommendation is waiting for an
            administrator or SRE operator to review its
            evidence.
          </div>
        )}

        {!canManage ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            You have read-only access. Only administrators
            and SRE operators can approve, reject, execute,
            or verify remediation.
          </p>
        ) : null}

        {canManage && canDecide ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onApprove}
                disabled={isBusy}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {busyAction === "approve"
                  ? "Approving…"
                  : "Approve recommendation"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRejectionForm(
                    (current) => !current,
                  );
                }}
                disabled={isBusy}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                Reject recommendation
              </button>
            </div>

            {showRejectionForm ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                <label
                  htmlFor="rejection-reason"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  Rejection reason
                </label>

                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(
                      event.target.value,
                    );
                  }}
                  rows={4}
                  maxLength={2000}
                  disabled={isBusy}
                  placeholder="Explain why this remediation should not execute."
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-red-950"
                />

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={submitRejection}
                    disabled={
                      isBusy ||
                      !rejectionReason.trim()
                    }
                    className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === "reject"
                      ? "Rejecting…"
                      : "Confirm rejection"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason("");
                    }}
                    disabled={isBusy}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {canManage && canExecute ? (
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              This recommendation is approved. Execution
              will still pass through all rollback-loop,
              duplication, and incident-state guardrails.
            </p>

            <button
              type="button"
              onClick={onExecute}
              disabled={isBusy}
              className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {busyAction === "execute"
                ? "Executing…"
                : "Execute remediation"}
            </button>
          </div>
        ) : null}

        {canManage && canVerify ? (
          <div className="rounded-lg border border-violet-300 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
            <p className="text-sm text-violet-900 dark:text-violet-200">
              Command execution completed. Verify service
              health before resolving the incident.
            </p>

            <button
              type="button"
              onClick={onVerify}
              disabled={isBusy}
              className="mt-4 rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-500"
            >
              {busyAction === "verify"
                ? "Verifying…"
                : "Verify recovery"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RemediationApprovalPanel;
