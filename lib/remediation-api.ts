import { apiFetch } from "@/lib/api";
import type {
  RecoveryVerificationResponse,
  RemediationDetail,
  RemediationExecutionResponse,
  RemediationRecommendation,
  RemediationRejectionRequest,
  RemediationStatusResponse,
} from "@/types/remediation";

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

export function listRemediations():
Promise<RemediationDetail[]> {
  return apiFetch<RemediationDetail[]>(
    "/api/remediations",
    {
      cache: "no-store",
    },
  );
}

export function listIncidentRemediations(
  incidentId: string,
): Promise<RemediationRecommendation[]> {
  return apiFetch<RemediationRecommendation[]>(
    (
      `/api/incidents/${encodeId(incidentId)}` +
      "/remediations"
    ),
    {
      cache: "no-store",
    },
  );
}

export function getRemediationDetail(
  remediationId: string,
): Promise<RemediationDetail> {
  return apiFetch<RemediationDetail>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/detail"
    ),
    {
      cache: "no-store",
    },
  );
}

export function getRemediationStatus(
  remediationId: string,
): Promise<RemediationStatusResponse> {
  return apiFetch<RemediationStatusResponse>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/status"
    ),
    {
      cache: "no-store",
    },
  );
}

export function generateRemediationRecommendation(
  incidentId: string,
): Promise<RemediationRecommendation> {
  return apiFetch<RemediationRecommendation>(
    (
      `/api/incidents/${encodeId(incidentId)}` +
      "/remediation/recommend"
    ),
    {
      method: "POST",
    },
  );
}

export function approveRemediation(
  remediationId: string,
): Promise<RemediationStatusResponse> {
  return apiFetch<RemediationStatusResponse>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/approve"
    ),
    {
      method: "POST",
    },
  );
}

export function rejectRemediation(
  remediationId: string,
  request: RemediationRejectionRequest,
): Promise<RemediationStatusResponse> {
  return apiFetch<RemediationStatusResponse>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/reject"
    ),
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function executeRemediation(
  remediationId: string,
): Promise<RemediationExecutionResponse> {
  return apiFetch<RemediationExecutionResponse>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/execute"
    ),
    {
      method: "POST",
    },
  );
}

export function verifyRemediationRecovery(
  remediationId: string,
): Promise<RecoveryVerificationResponse> {
  return apiFetch<RecoveryVerificationResponse>(
    (
      `/api/remediations/${encodeId(remediationId)}` +
      "/verification"
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
}
