import { hasValidApiKey, unauthorized } from "../../../../lib/security.js";
import { signwell } from "../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!hasValidApiKey(request)) return unauthorized();
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_APP_URL || request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host || host.includes("localhost")) return Response.json({ error: "Set NEXT_PUBLIC_APP_URL to the production HTTPS URL before registering the completion webhook." }, { status: 400 });
  const secret = process.env.SIGNATURE_HUB_WEBHOOK_TOKEN;
  if (!secret) return Response.json({ error: "Webhook signing secret is not configured." }, { status: 503 });
  const origin = /^https:\/\//.test(host) ? host : `https://${host}`;
  const callback_url = `${origin}/api/webhooks/signwell?token=${encodeURIComponent(secret)}`;
  try {
    const { body } = await signwell("/hooks", { method: "POST", body: JSON.stringify({ callback_url }) });
    return Response.json({ ok: true, webhook: body, callbackUrl: `${origin}/api/webhooks/signwell` });
  } catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
