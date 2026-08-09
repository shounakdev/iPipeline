import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { canManageExperiments } from "@/lib/auth";
import {
  formatDuration,
  nextPollDelay,
} from "@/lib/experiment-format";
import type {
  ChaosObservation,
  Experiment,
  ExperimentBenchmark,
  ExperimentRun,
} from "@/types/experiments";
import { BenchmarkSummary } from "./benchmark-summary";
import { DiagnosisResult } from "./diagnosis-result";
import { ExperimentList } from "./experiment-list";
import { ExperimentTimeline } from "./experiment-timeline";

const experiment: Experiment = {
  id: "experiment-1",
  name: "Payment latency drill",
  description: "Validate latency detection",
  scenario_type: "NETWORK_DELAY",
  target_service_id: "service-1",
  target_environment: "staging",
  target_namespace: "platformiq-staging",
  failure_type: "NETWORK_DELAY",
  failure_config: { duration_seconds: 120 },
  expected_behavior: { root_cause: "NETWORK_LATENCY" },
  enabled: true,
  created_by: "operator-1",
  created_at: "2026-08-09T10:00:00Z",
  updated_at: "2026-08-09T10:00:00Z",
};

const benchmark: ExperimentBenchmark = {
  id: "benchmark-1",
  chaos_run_id: "run-1",
  failure_injection_timestamp: "2026-08-09T10:00:00Z",
  first_anomaly_timestamp: "2026-08-09T10:00:18Z",
  alert_creation_timestamp: null,
  incident_creation_timestamp: null,
  rca_completion_timestamp: null,
  remediation_approval_timestamp: null,
  recovery_completion_timestamp: "2026-08-09T10:03:05Z",
  time_to_detect_ms: 18_000,
  time_to_alert_ms: 42_000,
  time_to_incident_ms: 50_000,
  time_to_diagnose_ms: 100_000,
  time_to_approve_ms: 130_000,
  time_to_recover_ms: 185_000,
  diagnosis_rating: "CORRECT",
  expected_root_cause: "NETWORK_LATENCY",
  actual_root_cause: "NETWORK_LATENCY",
  detection_succeeded: true,
  recovery_succeeded: true,
  benchmark_status: "PASSED",
  calculated_at: "2026-08-09T10:03:06Z",
};

function makeRun(overrides: Partial<ExperimentRun> = {}): ExperimentRun {
  return {
    id: "run-1",
    experiment_id: experiment.id,
    status: "COMPLETED",
    target_environment: "staging",
    target_service_id: "service-1",
    target_namespace: "platformiq-staging",
    duration_seconds: 120,
    cleanup_behavior: "delete",
    deadline_at: "2026-08-09T10:05:00Z",
    kubernetes_resource_kind: "NetworkChaos",
    kubernetes_resource_name: "latency-run-1",
    cleanup_succeeded: true,
    failure_message: null,
    triggered_by: "operator-1",
    started_at: "2026-08-09T10:00:00Z",
    failure_injected_at: "2026-08-09T10:00:00Z",
    completed_at: "2026-08-09T10:03:05Z",
    aborted_at: null,
    incident_id: null,
    rca_report_id: "rca-1",
    remediation_id: "remediation-1",
    remediation_execution_id: "execution-1",
    recovery_verification_id: "verification-1",
    observations: [],
    benchmark,
    ...overrides,
  };
}

function observation(
  id: string,
  type: ChaosObservation["observation_type"],
  observedAt: string,
): ChaosObservation {
  return {
    id,
    chaos_run_id: "run-1",
    observation_type: type,
    source: "test",
    observed_at: observedAt,
    resource_type: null,
    resource_id: null,
    details: {},
    created_at: observedAt,
  };
}

describe("experiment frontend", () => {
  it("renders the experiment list with required summary fields", () => {
    const html = renderToStaticMarkup(
      <ExperimentList
        items={[{ experiment, latestRun: makeRun(), serviceName: "payment-service" }]}
        canManage
        busyId={null}
        onStart={() => undefined}
        onAbort={() => undefined}
      />,
    );

    expect(html).toContain("Payment latency drill");
    expect(html).toContain("Network Delay");
    expect(html).toContain("payment-service");
    expect(html).toContain("18 s");
  });

  it("polls active runs and stops after terminal updates", () => {
    expect(nextPollDelay("OBSERVING")).toBe(4000);
    expect(nextPollDelay("RECOVERING")).toBe(4000);
    expect(nextPollDelay("COMPLETED")).toBeNull();
    expect(nextPollDelay("FAILED")).toBeNull();
    expect(nextPollDelay("ABORTED")).toBeNull();
  });

  it("orders timeline observations by observed time", () => {
    const html = renderToStaticMarkup(
      <ExperimentTimeline
        observations={[
          observation("2", "ALERT_CREATED", "2026-08-09T10:00:42Z"),
          observation("1", "FAILURE_INJECTED", "2026-08-09T10:00:00Z"),
          observation("3", "RECOVERY_COMPLETED", "2026-08-09T10:03:05Z"),
        ]}
      />,
    );

    expect(html.indexOf("Failure Injected")).toBeLessThan(html.indexOf("Alert Created"));
    expect(html.indexOf("Alert Created")).toBeLessThan(html.indexOf("Recovery Completed"));
  });

  it("displays missing RCA safely", () => {
    const html = renderToStaticMarkup(<DiagnosisResult run={makeRun({ rca_report_id: null, benchmark: null })} />);
    expect(html).toContain("Not available");
  });

  it("shows a failed run message", () => {
    const html = renderToStaticMarkup(<DiagnosisResult run={makeRun({ status: "FAILED", failure_message: "Recovery was not observed" })} />);
    expect(html).toContain("Run failed");
    expect(html).toContain("Recovery was not observed");
  });

  it("formats benchmark measurements with correct units", () => {
    const html = renderToStaticMarkup(<BenchmarkSummary benchmark={benchmark} />);
    expect(formatDuration(750)).toBe("750 ms");
    expect(html).toContain("18 s");
    expect(html).toContain("3.1 min");
  });

  it("enforces start and abort permissions", () => {
    expect(canManageExperiments("admin")).toBe(true);
    expect(canManageExperiments("operator")).toBe(true);
    expect(canManageExperiments("developer")).toBe(false);
    expect(canManageExperiments("viewer")).toBe(false);
    expect(canManageExperiments(null)).toBe(false);
  });
});