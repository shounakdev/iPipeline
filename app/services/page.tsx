"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { asArray, platformApi, type Service } from "@/lib/platformiq-api";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await platformApi.listServices();
        setServices(asArray<Service>(data, "services"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Services</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          View registered services and trigger pipelines from linked
          repositories.
        </p>
      </div>

      {loading && <p className="text-[var(--text-muted)]">Loading services...</p>}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-[var(--text-muted)]">
          No services found.
        </div>
      )}

      <div className="space-y-3">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition hover:border-blue-500"
          >
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              {service.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {service.description || "No description"}
            </p>
            <div className="mt-3 flex gap-2 text-xs text-[var(--text-muted)]">
              <span>Type: {service.service_type || "N/A"}</span>
              <span>Owner: {service.owner || "N/A"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
