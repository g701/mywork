export const dynamic = "force-dynamic";

export async function GET() {
  // The Vercel project applies SSO protection to all deployments. This endpoint is
  // deliberately available only in a deployed, SSO-protected environment.
  if (process.env.VERCEL !== "1" || !process.env.SIGNATURE_HUB_API_KEY) return Response.json({ error: "Protected setup is only available on the Vercel deployment." }, { status: 404 });
  return Response.json({ apiKey: process.env.SIGNATURE_HUB_API_KEY }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
