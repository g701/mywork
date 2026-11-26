export const dynamic = "force-dynamic";

export async function GET(request) {
  // The Vercel project applies SSO protection to all deployments. This endpoint is
  // deliberately available only in a deployed, SSO-protected environment.
  if (process.env.VERCEL !== "1" || !process.env.SIGNATURE_HUB_API_KEY) return Response.json({ error: "Protected setup is only available on the Vercel deployment." }, { status: 404 });
  // Vercel's edge SSO protection is the authentication boundary for normal requests.
  // If an automation bypass is configured for webhooks, additionally require the
  // edge-injected visitor identity so a bypass URL cannot reveal the app API key.
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET && !request.headers.get("x-vercel-oidc-passport-token")) {
    return Response.json({ error: "Vercel user authentication is required." }, { status: 401 });
  }
  return Response.json({ apiKey: process.env.SIGNATURE_HUB_API_KEY }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
