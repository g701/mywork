import { hasValidApiKey, unauthorized } from "../../../../../lib/security.js";
import { signwell } from "../../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!hasValidApiKey(request)) return unauthorized();
  const { id } = await params;
  try { const { body } = await signwell(`/documents/${encodeURIComponent(id)}/remind`, { method: "POST", body: JSON.stringify({}) }); return Response.json({ result: body || { ok: true } }); }
  catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
