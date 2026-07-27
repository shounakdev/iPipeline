"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type RCAStatus =
  | "NOT_GENERATED"
  | "QUEUED"
  | "COLLECTING_EVIDENCE"
  | "GENERATING_REPORT"
  | "COMPLETED"
  | "PARTIAL_EVIDENCE"
  | "FAILED";

type FeedbackRating =
  | "CORRECT"
  | "PARTIALLY_CORRECT"
  | "INCORRECT";

type JsonRecord = Record<string, unknown>;

type EvidenceSource = {
  status?: string;
  reason?: string;
  error?: string;
  important_observations?: string;
  before_after_comparison?: unknown;
  collection_window?: string;
};

type EvidenceResponse = {
  id?: string;
  status?: string;
  evidence_status?: string;
  version?: number | string;
  evidence_version?: number | string;
  completeness_score?: number;
  evidence_completeness?: number;
  missing_sources?: string[];
  normalized_evidence?: Record<string, EvidenceSource>;
  source_statuses?: Record<string, string>;
};

type AlternativeHypothesis = {
  hypothesis?: string;
  likelihood?: string;
  supporting_evidence?: string | string[];
  contradicting_evidence?: string | string[];
};

type RCAReportResponse = {
  id?: string;
  rca_report_id?: string;
  status?: string;
  report_status?: string;
  version?: number | string;
  report_version?: number | string;
  generated_at?: string;
  created_at?: string;
  confidence?: string;
  probable_root_cause?: string;
  root_cause_category?: string;
  confidence_explanation?: string;
  recommended_actions?: string[];
  alternative_hypotheses?: AlternativeHypothesis[];
  report?: RCAReportResponse;
  supporting_evidence?: unknown[];
  missing_evidence?: unknown[];
  failure_reason?: string;
};

type Props = {
  incidentId: string;
};



const evidenceSections = [
  "deployment",
  "pipeline",
  "slo",
  "metrics",
  "logs",
  "traces",
  "kubernetes",
];

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function isRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function asEvidenceResponse(
  value: unknown,
): EvidenceResponse | null {
  if (!isRecord(value)) return null;
  return value as EvidenceResponse;
}

function asReportResponse(
  value: unknown,
): RCAReportResponse | null {
  if (!isRecord(value)) return null;
  return value as RCAReportResponse;
}

function getEvidenceStatus(
  evidence: EvidenceResponse | null,
) {
  return (
    evidence?.evidence_status ??
    evidence?.status ??
    ""
  );
}

function getReportStatus(
  report: RCAReportResponse | null,
) {
  return report?.report_status ?? report?.status ?? "";
}

function getCompleteness(
  evidence: EvidenceResponse | null,
) {
  return (
    evidence?.completeness_score ??
    evidence?.evidence_completeness
  );
}

function deriveStatus(
  report: RCAReportResponse | null,
  evidence: EvidenceResponse | null,
): RCAStatus {
  const reportStatus =
    getReportStatus(report).toUpperCase();
  const evidenceStatus =
    getEvidenceStatus(evidence).toUpperCase();
  const completeness = getCompleteness(evidence);

  if (!report && !evidence) return "NOT_GENERATED";

  if (
    reportStatus === "PENDING" ||
    reportStatus === "QUEUED"
  ) {
    return "QUEUED";
  }

  if (
    evidenceStatus === "COLLECTING" ||
    evidenceStatus === "COLLECTING_EVIDENCE"
  ) {
    return "COLLECTING_EVIDENCE";
  }

  if (
    reportStatus === "GENERATING" ||
    reportStatus === "GENERATING_REPORT"
  ) {
    return "GENERATING_REPORT";
  }

  if (
    reportStatus === "FAILED" ||
    evidenceStatus === "FAILED"
  ) {
    return "FAILED";
  }

  if (
    reportStatus === "COMPLETED" &&
    (evidenceStatus === "PARTIAL" ||
      evidenceStatus === "PARTIAL_EVIDENCE" ||
      (typeof completeness === "number" &&
        completeness < 1))
  ) {
    return "PARTIAL_EVIDENCE";
  }

  if (reportStatus === "COMPLETED") {
    return "COMPLETED";
  }

  return "QUEUED";
}

async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function getEvidenceSource(
  evidence: EvidenceResponse | null,
  section: string,
): EvidenceSource {
  if (!evidence) return { status: "NO_DATA" };

  const normalized =
    evidence.normalized_evidence?.[section];

  if (normalized) return normalized;

  const directValue = (evidence as JsonRecord)[section];

  if (isRecord(directValue)) {
    return directValue as EvidenceSource;
  }

  return {
    status:
      evidence.source_statuses?.[section] ??
      "NO_DATA",
  };
}

function renderEvidenceValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (isRecord(value)) {
    return JSON.stringify(value, null, 2);
  }

  if (value === undefined || value === null) {
    return "None listed";
  }

  return String(value);
}

export function IncidentRCASection({
  incidentId,
}: Props) {
  const [evidence, setEvidence] =
    useState<EvidenceResponse | null>(null);
  const [report, setReport] =
    useState<RCAReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] =
    useState(false);
  const [feedbackRating, setFeedbackRating] =
    useState<FeedbackRating | null>(null);
  const [feedbackComment, setFeedbackComment] =
    useState("");
  const [feedbackSaved, setFeedbackSaved] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const loadRCA = useCallback(async () => {
    if (!incidentId) return;

    setError(null);

    try {
      const [evidenceData, reportData] =
        await Promise.all([
          requestJson<unknown>(
            `/api/incidents/${incidentId}/evidence`,
          ),
          requestJson<unknown>(
            `/api/incidents/${incidentId}/rca`,
          ),
      ]);

      setEvidence(asEvidenceResponse(evidenceData));

      const parsedReport = asReportResponse(reportData);

      if (
        parsedReport &&
        "report" in parsedReport &&
        parsedReport.report &&
        typeof parsedReport.report === "object"
      ) {
        setReport({
          ...parsedReport,
          ...(parsedReport.report as RCAReportResponse),
        });
      } else {
        setReport(parsedReport);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load RCA.",
      );
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRCA();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRCA]);

  const status = useMemo(
    () => deriveStatus(report, evidence),
    [report, evidence],
  );

  const shouldPoll =
    status === "QUEUED" ||
    status === "COLLECTING_EVIDENCE" ||
    status === "GENERATING_REPORT";

  useEffect(() => {
    if (!shouldPoll) return undefined;

    const intervalId = window.setInterval(() => {
      void loadRCA();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadRCA, shouldPoll]);

  async function handleGenerate(
    forceRegenerate = false,
  ) {
    setGenerating(true);
    setError(null);

    try {
      await requestJson(
        `/api/incidents/${incidentId}/rca/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            force_regenerate: forceRegenerate,
          }),
        },
      );

      await loadRCA();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate RCA.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleFeedback(
    rating: FeedbackRating,
  ) {
    const reportId = report?.id ?? report?.rca_report_id;

    if (!reportId) return;

    setFeedbackRating(rating);
    setFeedbackSaved(false);

    await requestJson(
      `/api/incidents/${incidentId}/rca/feedback`,
      {
        method: "POST",
        body: JSON.stringify({
          report_id: reportId,
          rating,
          comment:
            feedbackComment.trim() || undefined,
        }),
      },
    );

    setFeedbackSaved(true);
  }

  const completeness = getCompleteness(evidence);
  const reportVersion =
    report?.report_version ?? report?.version;
  const evidenceVersion =
    evidence?.evidence_version ?? evidence?.version;
  const generatedAt =
    report?.generated_at ?? report?.created_at;
    const fallbackRootCause =
    status === "PARTIAL_EVIDENCE" &&
    report?.confidence?.toUpperCase() === "LOW"
      ? "RCA completed with low confidence because the available evidence was partial or did not fully match the strict RCA schema."
      : undefined;

  const fallbackCategory =
    status === "PARTIAL_EVIDENCE" &&
    report?.confidence?.toUpperCase() === "LOW"
      ? "INSUFFICIENT_STRUCTURED_EVIDENCE"
      : undefined;

  const fallbackConfidenceExplanation =
    status === "PARTIAL_EVIDENCE" &&
    report?.confidence?.toUpperCase() === "LOW"
      ? "Confidence is low because some evidence sources were unavailable or incomplete, so the diagnosis should be treated as an investigation starting point."
      : undefined;

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Loading RCA...
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Root Cause Analysis
          </h2>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Status: {formatLabel(status)}</span>

            {report?.confidence && (
              <span>
                Confidence:{" "}
                {formatLabel(report.confidence)}
              </span>
            )}

            {typeof completeness === "number" && (
              <span>
                Evidence completeness:{" "}
                {Math.round(completeness * 100)}%
              </span>
            )}

            {evidenceVersion && (
              <span>Evidence v{evidenceVersion}</span>
            )}

            {reportVersion && (
              <span>Report v{reportVersion}</span>
            )}

            {generatedAt && (
              <span>
                Generated:{" "}
                {new Date(
                  generatedAt,
                ).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={generating}
          onClick={() => {
            void handleGenerate(Boolean(report));
          }}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
        >
          {generating
            ? "Generating..."
            : report
              ? "Regenerate RCA"
              : "Generate RCA"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {shouldPoll && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          RCA generation is in progress. This page
          will refresh automatically.
        </div>
      )}

      {status === "PARTIAL_EVIDENCE" && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
          Partial evidence warning: some sources were
          unavailable, so the diagnosis may be
          incomplete.
        </div>
      )}

      {status === "NOT_GENERATED" && (
        <div className="rounded-md border border-slate-300 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          No RCA has been generated for this incident
          yet.
        </div>
      )}

      {report && (
        <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-700">
          <h3 className="font-medium text-slate-950 dark:text-slate-100">
            Diagnosis
          </h3>

          <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <strong>Probable root cause:</strong>{" "}
              {report.probable_root_cause ??
                fallbackRootCause ??
                "Not available"}
            </p>

            <p>
              <strong>Root-cause category:</strong>{" "}
              {report.root_cause_category ??
                fallbackCategory ??
                "Not classified"}
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              {formatLabel(
                report.confidence ?? "unknown",
              )}
            </p>

            <p>
              <strong>Confidence explanation:</strong>{" "}
              {report.confidence_explanation ??
              (report.failure_reason
              ? "The RCA report completed with low confidence because strict evidence validation failed."
              : fallbackConfidenceExplanation ??
              "No explanation provided.")}
            </p>
          </div>
        </div>
      )}

      {report?.recommended_actions &&
        report.recommended_actions.length > 0 && (
          <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-700">
            <h3 className="font-medium text-slate-950 dark:text-slate-100">
              Recommended Investigation
            </h3>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {report.recommended_actions.map(
                (action) => (
                  <li key={action}>{action}</li>
                ),
              )}
            </ul>
          </div>
        )}

      {report?.alternative_hypotheses &&
        report.alternative_hypotheses.length >
          0 && (
          <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-700">
            <h3 className="font-medium text-slate-950 dark:text-slate-100">
              Alternative Hypotheses
            </h3>

            <div className="mt-3 space-y-3">
              {report.alternative_hypotheses.map(
                (item, index) => (
                  <div
                    key={`${item.hypothesis ?? "hypothesis"}-${index}`}
                    className="rounded-md border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  >
                    <p>
                      <strong>Hypothesis:</strong>{" "}
                      {item.hypothesis ??
                        "Not provided"}
                    </p>

                    <p>
                      <strong>Likelihood:</strong>{" "}
                      {item.likelihood ??
                        "Not provided"}
                    </p>

                    <p>
                      <strong>
                        Supporting evidence:
                      </strong>{" "}
                      {renderEvidenceValue(
                        item.supporting_evidence,
                      )}
                    </p>

                    <p>
                      <strong>
                        Contradicting evidence:
                      </strong>{" "}
                      {renderEvidenceValue(
                        item.contradicting_evidence,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {evidence && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-950 dark:text-slate-100">
            Supporting Evidence
          </h3>

          <div className="grid gap-3 lg:grid-cols-2">
            {evidenceSections.map((section) => {
              const source = getEvidenceSource(
                evidence,
                section,
              );

              return (
                <div
                  key={section}
                  className="rounded-lg border border-slate-300 p-4 text-sm dark:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium text-slate-950 dark:text-slate-100">
                      {formatLabel(section)}
                    </h4>

                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                      {formatLabel(
                        source.status ?? "NO_DATA",
                      )}
                    </span>
                  </div>

                  {source.important_observations && (
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                      <strong>Observations:</strong>{" "}
                      {
                        source.important_observations
                      }
                    </p>
                  )}

                  {source.before_after_comparison !==
                    undefined && (
                    <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {renderEvidenceValue(
                        source.before_after_comparison,
                      )}
                    </pre>
                  )}

                  {source.collection_window && (
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                      <strong>Collection window:</strong>{" "}
                      {source.collection_window}
                    </p>
                  )}

                  {source.reason && (
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      Missing data: {source.reason}
                    </p>
                  )}

                  {source.error && (
                    <p className="mt-2 text-red-700 dark:text-red-300">
                      Collector failure: {source.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {evidence?.missing_sources &&
        evidence.missing_sources.length > 0 && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
            <h3 className="font-medium">
              Missing Evidence
            </h3>

            <ul className="mt-2 list-disc pl-5">
              {evidence.missing_sources.map(
                (source) => (
                  <li key={source}>
                    {formatLabel(source)} data was
                    unavailable for this incident
                    window.
                  </li>
                ),
              )}
            </ul>

            <p className="mt-2">
              The diagnosis may not identify the exact
              failing dependency.
            </p>
          </div>
        )}

      {(report?.id || report?.rca_report_id) && (
        <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-700">
          <h3 className="font-medium text-slate-950 dark:text-slate-100">
            Feedback
          </h3>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Rating report version{" "}
            {reportVersion ??
              report.id ??
              report.rca_report_id}
          </p>

          <textarea
            value={feedbackComment}
            onChange={(event) => {
              setFeedbackComment(event.target.value);
            }}
            placeholder="Optional comment"
            className="mt-3 min-h-20 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleFeedback("CORRECT");
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              Correct
            </button>

            <button
              type="button"
              onClick={() => {
                void handleFeedback(
                  "PARTIALLY_CORRECT",
                );
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              Partially Correct
            </button>

            <button
              type="button"
              onClick={() => {
                void handleFeedback("INCORRECT");
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              Incorrect
            </button>
          </div>

          {feedbackRating && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Selected:{" "}
              {formatLabel(feedbackRating)}
              {feedbackSaved ? " - saved" : ""}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
