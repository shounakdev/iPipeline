export type RemediationActionType =
  | "ROLLBACK_DEPLOYMENT"
  | "RESTART_POD"
  | "SCALE_REPLICAS"
  | "REDEPLOY_REVISION";

export type RecommendationStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERY_VERIFIED"
  | "RECOVERY_FAILED";

export type ApprovalDecision =
  | "APPROVED"
  | "REJECTED";

export type RemediationExecutionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "FAILED";

export type RecoveryVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED";

export type RemediationConfidence =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type RemediationRecommendation = {
  id: string;
  incident_id: string;
  service_id: string;
  environment: string;
  action_type: RemediationActionType;
  reason: string;
  evidence_summary: Record<string, unknown>;
  confidence: RemediationConfidence;
  status: RecommendationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RemediationApproval = {
  id: string;
  remediation_id: string;
  approved_by: string | null;
  decision: ApprovalDecision;
  rejection_reason: string | null;
  approved_at: string;
};

export type RemediationStatusResponse =
  RemediationRecommendation & {
    approval: RemediationApproval | null;
  };

export type RemediationExecutionRecord = {
  id: string;
  remediation_id: string;
  command_type: RemediationActionType;
  command_payload: Record<string, unknown>;
  execution_status: RemediationExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  result_summary: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
};

export type RecoveryVerificationRecord = {
  id: string;
  remediation_id: string;
  remediation_execution_id: string;
  verification_status: RecoveryVerificationStatus;
  error_rate_recovered: boolean;
  latency_recovered: boolean;
  pods_healthy: boolean;
  restart_loop_absent: boolean;
  availability_restored: boolean;
  metrics_snapshot: Record<string, unknown>;
  verified_at: string;
};

export type RemediationAuditEvent = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type RemediationDetail =
  RemediationStatusResponse & {
    execution: RemediationExecutionRecord | null;
    verification: RecoveryVerificationRecord | null;
    audit_history: RemediationAuditEvent[];
  };

export type RemediationExecutionResponse = {
  execution_id: string;
  remediation_id: string;
  action_type: RemediationActionType;
  command_type: string;
  status: string;
  message: string;
  target_revision: string | null;
  target_pod: string | null;
  replica_count: number | null;
  simulated: boolean;
  started_at: string;
  completed_at: string;
};

export type RecoveryVerificationResponse = {
  verification_id: string;
  remediation_id: string;
  execution_id: string;
  status: RecoveryVerificationStatus;
  recovered: boolean;
  error_rate_recovered: boolean;
  latency_recovered: boolean;
  pods_healthy: boolean;
  restart_loop_absent: boolean;
  availability_restored: boolean;
  metrics_snapshot: Record<string, unknown>;
  verified_at: string;
};

export type RemediationRejectionRequest = {
  rejection_reason: string;
};
