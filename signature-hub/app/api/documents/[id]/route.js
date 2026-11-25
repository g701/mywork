import { hasValidApiKey, unauthorized } from "../../../../lib/security.js";
import { signwell } from "../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!hasValidApiKey(request)) return unauthorized();
  const { id } = await params;
  try { const { body } = await signwell(`/documents/${encodeURIComponent(id)}`); return Response.json({ document: body, testMode: true }, { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
