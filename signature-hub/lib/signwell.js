const BASE = "https://www.signwell.com/api/v1";

export async function signwell(path, init = {}) {
  const key = process.env.SIGNWELL_API_KEY;
  if (!key) throw new Error("SignWell is not configured. Add SIGNWELL_API_KEY in Vercel.");
  const headers = new Headers(init.headers || {});
  headers.set("X-Api-Key", key);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof body === "object" ? body?.errors || body?.error || body?.message : body;
    throw Object.assign(new Error(typeof detail === "string" ? detail : JSON.stringify(detail || "SignWell request failed")), { status: response.status });
  }
  return { response, body };
}

export async function getCompletedPdf(id) {
  const key = process.env.SIGNWELL_API_KEY;
  if (!key) throw new Error("SignWell is not configured.");
  const response = await fetch(`${BASE}/documents/${encodeURIComponent(id)}/completed_pdf?audit_page=true&file_format=pdf`, {
    headers: { "X-Api-Key": key, Accept: "application/pdf" }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`SignWell PDF download failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}
