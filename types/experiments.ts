export type ChaosScenarioType =
  | "FAULTY_RELEASE"
  | "POD_KILL"
  | "NETWORK_DELAY"
  | "DATABASE_DELAY"
  | "CPU_PRESSURE";

export type ChaosRunStatus =
  | "PENDING"
  | "RUNNING"
  | "FAULT_INJECTED"
  | "OBSERVING"
  | "RECOVERING"
  | "COMPLETED"
  | "FAILED"
  | "ABORTED";

export type ChaosObservationType =
  | "FAILURE_INJECTED"
  | "TELEMETRY_ANOMALY"
  | "ALERT_CREATED"
  | "INCIDENT_CREATED"
  | "RCA_COMPLETED"
  | "REMEDIATION_RECOMMENDED"
  | "REMEDIATION_APPROVED"
  | "REMEDIATION_EXECUTED"
  | "RECOVERY_COMPLETED";

export type DiagnosisRating =
  | "CORRECT"
  | "PARTIALLY_CORRECT"
  | "INCORRECT"
  | "NOT_AVAILABLE";

export type BenchmarkStatus =
  | "PASSED"
  | "FAILED"
  | "INCOMPLETE";

export type Experiment = {
  id: string;
  name: string;
  description: string | null;
  scenario_type: ChaosScenarioType;
  target_service_id: string;
  target_environment: string;
  target_namespace: string;
  failure_type: string;
  failure_config: Record<string, unknown>;
  expected_behavior: Record<string, unknown>;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperimentCreateInput = {
  name: string;
  description?: string;
  scenario_type: ChaosScenarioType;
  target_service_id: string;
  target_environment: string;
  target_namespace: string;
  failure_config: Record<string, unknown>;
  expected_behavior: Record<string, unknown>;
  enabled: boolean;
};

export type ChaosObservation = {
  id: string;
  chaos_run_id: string;
  observation_type: ChaosObservationType;
  source: string;
  observed_at: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type ExperimentBenchmark = {
  id: string;
  chaos_run_id: string;
  failure_injection_timestamp: string | null;
  first_anomaly_timestamp: string | null;
  alert_creation_timestamp: string | null;
  incident_creation_timestamp: string | null;
  rca_completion_timestamp: string | null;
  remediation_approval_timestamp: string | null;
  recovery_completion_timestamp: string | null;
  time_to_detect_ms: number | null;
  time_to_alert_ms: number | null;
  time_to_incident_ms: number | null;
  time_to_diagnose_ms: number | null;
  time_to_approve_ms: number | null;
  time_to_recover_ms: number | null;
  diagnosis_rating: DiagnosisRating;
  expected_root_cause: string | null;
  actual_root_cause: string | null;
  detection_succeeded: boolean | null;
  recovery_succeeded: boolean | null;
  benchmark_status: BenchmarkStatus;
  calculated_at: string;
};

export type ExperimentRun = {
  id: string;
  experiment_id: string;
  status: ChaosRunStatus;
  target_environment: string;
  target_service_id: string;
  target_namespace: string;
  duration_seconds: number;
  cleanup_behavior: string;
  deadline_at: string;
  kubernetes_resource_kind: string | null;
  kubernetes_resource_name: string | null;
  cleanup_succeeded: boolean | null;
  failure_message: string | null;
  triggered_by: string | null;
  started_at: string | null;
  failure_injected_at: string | null;
  completed_at: string | null;
  aborted_at: string | null;
  incident_id: string | null;
  rca_report_id: string | null;
  remediation_id: string | null;
  remediation_execution_id: string | null;
  recovery_verification_id: string | null;
  observations: ChaosObservation[];
  benchmark: ExperimentBenchmark | null;
};

export type ExperimentRunQueued = {
  run_id: string;
  experiment_id: string;
  status: ChaosRunStatus;
  message: string;
};

export type ExperimentListItem = {
  experiment: Experiment;
  latestRun: ExperimentRun | null;
  serviceName: string;
};