import { hasValidApiKey, unauthorized } from "../../../../../lib/security.js";
import { signwell } from "../../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!hasValidApiKey(request)) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const { body: result } = await signwell(`/documents/${encodeURIComponent(id)}/send`, { method: "POST", body: JSON.stringify({ test_mode: true, reminders: body.reminders !== false }) });
    return Response.json({ document: result, testMode: true, sent: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
