export type IncidentSeverity =
  | "SEV-1"
  | "SEV-2"
  | "SEV-3";

export type IncidentStatus =
  | "DETECTED"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "ACTION_RECOMMENDED"
  | "REMEDIATING"
  | "RESOLVED"
  | "FAILED_RECOVERY";

export type OperatorSummary = {
  id?: string | null;
  user_id?: string | null;
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
};

export type ServiceSummary = {
  id?: string | null;
  service_id?: string | null;
  name?: string | null;
  service_name?: string | null;
  environment?: string | null;
};

export type DeploymentSummary = {
  id: string;
  deployment_id?: string | null;
  version?: string | null;
  commit_sha?: string | null;
  commit_hash?: string | null;
  environment?: string | null;
  status?: string | null;
  deployed_at?: string | null;
  created_at?: string | null;
};

export type ReliabilityAlertSummary = {
  id: string;
  alert_id?: string | null;
  alert_type?: string | null;
  severity?: string | null;
  status?: string | null;
  message?: string | null;
  slo_type?: string | null;
  triggered_value?: number | null;
  threshold?: number | null;
  error_budget_status?: string | null;
  created_at?: string | null;
};

export type IncidentAssignment = {
  id: string;
  incident_id: string;
  assigned_to_user_id: string | null;
  assigned_to_user: OperatorSummary | null;
  assigned_by_user_id: string | null;
  assigned_by_user: OperatorSummary | null;
  assignment_note: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  is_active: boolean;
};

export type IncidentComment = {
  id: string;
  incident_id: string;
  author_user_id: string | null;
  author: OperatorSummary | null;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type IncidentMetric = {
  id: string;
  incident_id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string | null;
  source: string;
  captured_at: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export type IncidentCalculatedMetrics = {
  mttd_seconds: number | null;
  mtta_seconds: number | null;
  mttr_seconds: number | null;
  mttd_display: string | null;
  mtta_display: string | null;
  mttr_display: string | null;
};

export type IncidentListItem = {
  incident_id: string;
  id: string | null;
  incident_number: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service_id: string;
  service_name: string | null;
  environment: string;
  assigned_operator: OperatorSummary | null;
  suspected_deployment_id: string | null;
  failure_started_at: string | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  mttd_seconds: number | null;
  mtta_seconds: number | null;
  mttr_seconds: number | null;
  mttd_display: string | null;
  mtta_display: string | null;
  mttr_display: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentListResponse = {
  items: IncidentListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type IncidentTimelineEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  source: string;
  message: string | null;
  from_status: IncidentStatus | null;
  to_status: IncidentStatus | null;
  actor_user_id: string | null;
  actor: OperatorSummary | null;
  alert_id: string | null;
  alert: ReliabilityAlertSummary | null;
  deployment_id: string | null;
  deployment: DeploymentSummary | null;
  metadata_json: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
};

export type IncidentTimelineResponse = {
  incident_id: string;
  events: IncidentTimelineEvent[];
};

export type IncidentMetricsResponse = {
  incident_id: string;
  metric_snapshot: IncidentMetric[];
  mttd_seconds: number | null;
  mtta_seconds: number | null;
  mttr_seconds: number | null;
  mttd_display: string | null;
  mtta_display: string | null;
  mttr_display: string | null;
  alert_threshold: number | null;
  triggered_value: number | null;
  error_budget_status: string | null;
};

export type IncidentMetricsSummary = {
  average_mttd_seconds: number | null;
  average_mtta_seconds: number | null;
  average_mttr_seconds: number | null;
  average_mttd_display: string | null;
  average_mtta_display: string | null;
  average_mttr_display: string | null;
  open_incident_count: number;
  resolved_incident_count: number;
  sev_1_incident_count: number;
  sev_2_incident_count: number;
  sev_3_incident_count: number;
};

export type IncidentDetail = {
  incident: IncidentListItem;
  description: string | null;
  deduplication_key: string;

  primary_service: ServiceSummary;
  affected_services: ServiceSummary[];

  triggering_alert_id: string | null;
  triggering_alert: ReliabilityAlertSummary | null;
  related_alerts: ReliabilityAlertSummary[];

  suspected_deployment: DeploymentSummary | null;

  failure_started_at: string | null;
  investigation_started_at: string | null;
  remediation_started_at: string | null;

  created_by: string | null;
  creator: OperatorSummary | null;

  current_assignment: IncidentAssignment | null;
  assignment_history: IncidentAssignment[];
  comments: IncidentComment[];
  metric_snapshot: IncidentMetric[];
  timeline_summary: IncidentTimelineEvent[];

  resolution_summary: string | null;
  rca_summary: string | null;
  remediation_summary: string | null;

  calculated_incident_metrics:
    | IncidentCalculatedMetrics
    | null;
};

export type IncidentListFilters = {
  status?: IncidentStatus | "";
  severity?: IncidentSeverity | "";
  service_id?: string;
  environment?: string;
  assignee_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
};

export type IncidentAcknowledgeRequest = {
  note?: string | null;
  assign_to_self?: boolean;
};

export type IncidentAssignRequest = {
  assigned_to_user_id: string;
  note?: string | null;
};

export type IncidentStatusUpdateRequest = {
  status: IncidentStatus;
  reason: string;
};

export type IncidentCommentCreateRequest = {
  comment: string;
};