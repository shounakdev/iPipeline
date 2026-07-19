import { getAccessToken } from "@/lib/auth";
import type {
  IncidentAcknowledgeRequest,
  IncidentAssignRequest,
  IncidentComment,
  IncidentCommentCreateRequest,
  IncidentDetail,
  IncidentListFilters,
  IncidentListResponse,
  IncidentMetricsResponse,
  IncidentMetricsSummary,
  IncidentStatusUpdateRequest,
  IncidentTimelineResponse,
} from "@/types/incidents";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail =
      `${response.status} ${response.statusText}`;

    try {
      const errorBody =
        (await response.json()) as ApiErrorPayload;

      detail =
        errorBody.detail ??
        errorBody.message ??
        detail;
    } catch {
      // Retain the HTTP status fallback.
    }

    throw new Error(detail);
  }

  return (await response.json()) as T;
}

function buildIncidentQuery(
  filters: IncidentListFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.severity) {
    params.set("severity", filters.severity);
  }

  if (filters.service_id?.trim()) {
    params.set(
      "service_id",
      filters.service_id.trim(),
    );
  }

  if (filters.environment?.trim()) {
    params.set(
      "environment",
      filters.environment.trim(),
    );
  }

  if (filters.assignee_id?.trim()) {
    params.set(
      "assignee_id",
      filters.assignee_id.trim(),
    );
  }

  if (filters.from_date) {
    params.set("from_date", filters.from_date);
  }

  if (filters.to_date) {
    params.set("to_date", filters.to_date);
  }

  params.set(
    "page",
    String(filters.page ?? 1),
  );

  params.set(
    "page_size",
    String(filters.page_size ?? 25),
  );

  return params.toString();
}

export function listIncidents(
  filters: IncidentListFilters = {},
): Promise<IncidentListResponse> {
  const query = buildIncidentQuery(filters);

  return requestJson<IncidentListResponse>(
    `/api/incidents?${query}`,
  );
}

export function getIncidentMetricsSummary():
Promise<IncidentMetricsSummary> {
  return requestJson<IncidentMetricsSummary>(
    "/api/incidents/metrics/summary",
  );
}

export async function getUnacknowledgedIncidentCount():
Promise<number> {
  const response = await listIncidents({
    status: "DETECTED",
    page: 1,
    page_size: 1,
  });

  return response.total;
}

export function getIncident(
  incidentId: string,
): Promise<IncidentDetail> {
  return requestJson<IncidentDetail>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}`,
  );
}

export function getIncidentTimeline(
  incidentId: string,
): Promise<IncidentTimelineResponse> {
  return requestJson<IncidentTimelineResponse>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/timeline`,
  );
}

export function getIncidentMetrics(
  incidentId: string,
): Promise<IncidentMetricsResponse> {
  return requestJson<IncidentMetricsResponse>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/metrics`,
  );
}

export function acknowledgeIncident(
  incidentId: string,
  request: IncidentAcknowledgeRequest,
): Promise<IncidentDetail> {
  return requestJson<IncidentDetail>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/acknowledge`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function assignIncident(
  incidentId: string,
  request: IncidentAssignRequest,
): Promise<IncidentDetail> {
  return requestJson<IncidentDetail>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/assign`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function updateIncidentStatus(
  incidentId: string,
  request: IncidentStatusUpdateRequest,
): Promise<IncidentDetail> {
  return requestJson<IncidentDetail>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/status`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function createIncidentComment(
  incidentId: string,
  request: IncidentCommentCreateRequest,
): Promise<IncidentComment> {
  return requestJson<IncidentComment>(
    `/api/incidents/${encodeURIComponent(
      incidentId,
    )}/comments`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export async function getIncidentPageData(
  incidentId: string,
): Promise<{
  incident: IncidentDetail;
  timeline: IncidentTimelineResponse;
  metrics: IncidentMetricsResponse;
}> {
  const [incident, timeline, metrics] =
    await Promise.all([
      getIncident(incidentId),
      getIncidentTimeline(incidentId),
      getIncidentMetrics(incidentId),
    ]);

  return {
    incident,
    timeline,
    metrics,
  };
}