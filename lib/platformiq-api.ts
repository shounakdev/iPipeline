const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  created_by?: string | null;
};

export type Environment = {
  id?: string;
  service_id?: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
};

export type Repository = {
  id?: string;
  service_id?: string;
  provider?: string | null;
  repo_url: string;
  default_branch?: string | null;
  created_at?: string;
};

export type AuditEvent = {
  id: string;
  actor_id?: string | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
  details?: unknown;
};

export type Service = {
  id: string;
  project_id?: string | null;
  name: string;
  description?: string | null;
  service_type?: string | null;
  owner?: string | null;
  created_at?: string;
  repository?: Repository | null;
  repositories?: Repository[];
  environments?: Environment[];
  audit_events?: AuditEvent[];
};

export function asArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj[key])) {
      return obj[key] as T[];
    }
  }

  return [];
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("platformiq_token");

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data?.detail || data?.message || `Request failed with status ${res.status}`;

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data as T;
}

async function listAllServices(): Promise<Service[]> {
  const projectsData = await request<Project[] | { projects: Project[] }>(
    "/projects"
  );

  const projects = asArray<Project>(projectsData, "projects");

  const serviceLists = await Promise.all(
    projects.map(async (project) => {
      const data = await request<Service[] | { services: Service[] }>(
        `/projects/${project.id}/services`
      );

      return asArray<Service>(data, "services").map((service) => ({
        ...service,
        project_id: service.project_id || project.id,
      }));
    })
  );

  return serviceLists.flat();
}

async function findServiceById(serviceId: string): Promise<Service> {
  const services = await listAllServices();
  const match = services.find((service) => service.id === serviceId);

  if (!match?.project_id) {
    throw new Error("Service not found");
  }

  const service = await request<Service>(
    `/projects/${match.project_id}/services/${serviceId}`
  );

  return {
    ...service,
    project_id: service.project_id || match.project_id,
  };
}

export const platformApi = {
  listProjects() {
    return request<Project[] | { projects: Project[] }>("/projects");
  },

  getProject(projectId: string) {
    return request<Project>(`/projects/${projectId}`);
  },

  listServices() {
    return listAllServices();
  },

  listProjectServices(projectId: string) {
    return request<Service[] | { services: Service[] }>(
      `/projects/${projectId}/services`
    );
  },

  getService(serviceId: string) {
    return findServiceById(serviceId);
  },

  triggerPipeline(repo_url: string, branch: string) {
    return request<unknown>("/pipeline/trigger", {
      method: "POST",
      body: JSON.stringify({
        repo_url,
        branch,
      }),
    });
  },

  triggerServicePipeline(projectId: string, serviceId: string) {
    return request<unknown>(
      `/projects/${projectId}/services/${serviceId}/trigger-pipeline`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
  },
};

export function getLinkedRepository(service: Service | null): Repository | null {
  if (!service) return null;

  if (service.repository?.repo_url) {
    return service.repository;
  }

  if (service.repositories?.length) {
    return service.repositories[0];
  }

  return null;
}
