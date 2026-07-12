export type SLOMetricType =
  | "AVAILABILITY"
  | "P95_LATENCY"
  | "ERROR_RATE"
  | string;

export type ReliabilityState =
  | "HEALTHY"
  | "WARNING"
  | "BREACHED"
  | "EXHAUSTED"
  | "NO_DATA"
  | string;

export type ReliabilityAlertStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | string;

export type ReliabilitySeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | string;

export interface DeploymentSummary {
  id: string;
  version?: string | null;
  commit_sha?: string | null;
  environment?: string | null;
  status?: string | null;
  created_at?: string | null;
}

/**
 * A completed reliability measurement returned by the measurements API.
 *
 * Unlike ReliabilitySLOState, completed measurement records must contain
 * non-null measured_value and evaluated_at values.
 */
export interface ReliabilityMeasurement {
  measurement_id: string;
  slo_definition_id: string;
  service_id: string;
  service_name: string;
  metric_type: string;
  target_value: number;
  measured_value: number;
  is_breached: boolean;
  window_minutes: number;
  source: string;
  evaluated_at: string;
}

/**
 * Current state of an SLO.
 *
 * measured_value and evaluated_at may be null when an SLO has not yet
 * been evaluated or when monitoring data is unavailable.
 */
export interface ReliabilitySLOState {
  slo_definition_id: string;
  metric_type: SLOMetricType;
  target_value: number;
  measured_value: number | null;
  status: ReliabilityState;
  evaluated_at: string | null;
  error_budget_state?: ReliabilityState | null;
}

export interface ReliabilityAlert {
  id: string;
  service_id: string;
  slo_definition_id?: string | null;
  alert_type: string;
  severity: ReliabilitySeverity;
  triggered_value: number | null;
  threshold_value: number | null;
  deployment_id?: string | null;
  deployment?: DeploymentSummary | null;
  status: ReliabilityAlertStatus;
  created_at: string;
  resolved_at?: string | null;
}

export interface ServiceReliabilityResponse {
  service_id: string;
  service_name: string;
  overall_status?: ReliabilityState | null;
  slos: ReliabilitySLOState[];
  open_alerts: ReliabilityAlert[];
  open_alert_count?: number;
  latest_deployment: DeploymentSummary | null;

  /**
   * Keep the property that matches your backend response.
   *
   * Both are optional temporarily so the frontend supports either API
   * response name while the contract is being confirmed.
   */
  measurements?: ReliabilityMeasurement[];
  recent_measurements?: ReliabilityMeasurement[];
}

export interface ErrorBudgetItem {
  slo_definition_id: string;
  metric_type: SLOMetricType;
  target_percentage: number;
  remaining_percentage: number;
  consumed_percentage: number;
  burn_rate: number;
  status: ReliabilityState;
  evaluated_at: string | null;
}

export interface ServiceErrorBudgetResponse {
  service_id: string;
  budgets: ErrorBudgetItem[];
}

export interface ServiceListItem {
  id: string;
  name: string;
}