// src/lib/api/rca.ts

export async function generateRCA(incidentId: string, forceRegenerate = false) {
  const res = await fetch(`/api/incidents/${incidentId}/rca/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force_regenerate: forceRegenerate }),
  });

  if (!res.ok) throw new Error("Failed to queue RCA generation");
  return res.json();
}

export async function getIncidentEvidence(incidentId: string) {
  const res = await fetch(`/api/incidents/${incidentId}/evidence`);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load RCA evidence");

  return res.json();
}

export async function getIncidentRCA(incidentId: string) {
  const res = await fetch(`/api/incidents/${incidentId}/rca`);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load RCA report");

  return res.json();
}

export async function submitRCAFeedback(
  incidentId: string,
  payload: {
    report_id: string;
    rating: "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT";
    comment?: string;
  }
) {
  const res = await fetch(`/api/incidents/${incidentId}/rca/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to submit RCA feedback");
  return res.json();
}