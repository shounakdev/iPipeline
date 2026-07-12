import type {
  ReliabilityAlert,
  ServiceErrorBudgetResponse,
  ServiceListItem,
  ServiceReliabilityResponse,
} from "@/types/reliability";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

type RawProject = {
  id?: string;
  project_id?: string;
  name?: string;
};

type ProjectListPayload =
  | RawProject[]
  | {
      projects?: RawProject[];
      items?: RawProject[];
    };

type RawService = {
  id?: string;
  service_id?: string;
  project_id?: string;
  name?: string;
  service_name?: string;
};

type ServiceListPayload =
  | RawService[]
  | {
      services?: RawService[];
      items?: RawService[];
    };

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;

    try {
      const errorBody = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      detail =
        errorBody.detail ??
        errorBody.message ??
        detail;
    } catch {
      // Keep the HTTP status as the fallback message.
    }

    throw new Error(`${detail} — ${url}`);
  }

  return (await response.json()) as T;
}

function extractProjects(
  payload: ProjectListPayload,
): RawProject[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.projects ?? payload.items ?? [];
}

function extractServices(
  payload: ServiceListPayload,
): RawService[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.services ?? payload.items ?? [];
}

/**
 * The backend does not expose GET /api/services.
 *
 * Services must be collected by:
 * 1. Loading GET /projects
 * 2. Loading GET /projects/{projectId}/services for each project
 */
export async function listServices(): Promise<
  ServiceListItem[]
> {
  const projectPayload =
    await requestJson<ProjectListPayload>("/projects");

  const projects = extractProjects(projectPayload)
    .map((project) => ({
      id: project.id ?? project.project_id ?? "",
      name: project.name ?? "Unnamed project",
    }))
    .filter((project) => project.id.length > 0);

  if (projects.length === 0) {
    return [];
  }

  const servicePayloads = await Promise.all(
    projects.map(async (project) => {
      const payload =
        await requestJson<ServiceListPayload>(
          `/projects/${encodeURIComponent(
            project.id,
          )}/services`,
        );

      return extractServices(payload);
    }),
  );

  const servicesById = new Map<
    string,
    ServiceListItem
  >();

  for (const rawService of servicePayloads.flat()) {
    const serviceId =
      rawService.id ??
      rawService.service_id ??
      "";

    if (!serviceId) {
      continue;
    }

    servicesById.set(serviceId, {
      id: serviceId,
      name:
        rawService.name ??
        rawService.service_name ??
        "Unnamed service",
    });
  }

  return Array.from(servicesById.values());
}

export function getServiceReliability(
  serviceId: string,
): Promise<ServiceReliabilityResponse> {
  return requestJson<ServiceReliabilityResponse>(
    `/api/services/${encodeURIComponent(
      serviceId,
    )}/reliability`,
  );
}

export function getServiceErrorBudget(
  serviceId: string,
): Promise<ServiceErrorBudgetResponse> {
  return requestJson<ServiceErrorBudgetResponse>(
    `/api/services/${encodeURIComponent(
      serviceId,
    )}/error-budget`,
  );
}

export function listReliabilityAlerts(): Promise<
  ReliabilityAlert[]
> {
  return requestJson<ReliabilityAlert[]>(
    "/api/alerts",
  );
}

export function getReliabilityAlert(
  alertId: string,
): Promise<ReliabilityAlert> {
  return requestJson<ReliabilityAlert>(
    `/api/alerts/${encodeURIComponent(
      alertId,
    )}`,
  );
}

/**
 * The service summary endpoint may expose only deployment_id on each
 * alert. Alert detail includes the joined deployment object, so enrich
 * active alerts before rendering the service page.
 */
export async function getServiceReliabilityPageData(
  serviceId: string,
): Promise<{
  reliability: ServiceReliabilityResponse;
  errorBudget: ServiceErrorBudgetResponse;
}> {
  const [reliability, errorBudget] =
    await Promise.all([
      getServiceReliability(serviceId),
      getServiceErrorBudget(serviceId),
    ]);

  const openAlerts = reliability.open_alerts ?? [];

  const enrichedAlerts = await Promise.all(
    openAlerts.map(async (alert) => {
      if (
        alert.deployment ||
        !alert.deployment_id
      ) {
        return alert;
      }

      try {
        return await getReliabilityAlert(alert.id);
      } catch {
        return alert;
      }
    }),
  );

  return {
    reliability: {
      ...reliability,
      open_alerts: enrichedAlerts,
    },
    errorBudget,
  };
}