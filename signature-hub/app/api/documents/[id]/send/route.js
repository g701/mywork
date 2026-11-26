import { hasValidApiKey, unauthorized } from "../../../../../lib/security.js";
import { signwell } from "../../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!hasValidApiKey(request)) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const mode = String(body.mode || "test");
    if (!["test", "live"].includes(mode)) return Response.json({ error: "Request mode must be test or live." }, { status: 400 });
    if (mode === "live" && process.env.SIGNATURE_HUB_LIVE_ENABLED !== "true") return Response.json({ error: "Live sending has not been enabled for this workspace." }, { status: 403 });
    const { body: result } = await signwell(`/documents/${encodeURIComponent(id)}/send`, { method: "POST", body: JSON.stringify({ test_mode: mode !== "live", reminders: body.reminders !== false }) });
    return Response.json({ document: result, testMode: mode !== "live", sent: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
