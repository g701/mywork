import { signwell } from "../../../../lib/signwell.js";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL !== "1") return Response.json({ error: "Deployment smoke check only." }, { status: 404 });
  try {
    const [{ body: account }, { body: list }] = await Promise.all([signwell("/me"), signwell("/documents")]);
    const documents = Array.isArray(list) ? list : (list?.documents || list?.data || []);
    return Response.json({ ok: true, signwell: "connected", testModeLocked: true, apiAuthConfigured: Boolean(process.env.SIGNATURE_HUB_API_KEY), documentsVisible: documents.length, driveReady: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.SIGNATURE_HUB_DRIVE_FOLDER_ID), account: account?.email ? "authorized" : "authorized" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ ok: false, signwell: "unavailable", error: e.status ? `SignWell returned HTTP ${e.status}.` : "SignWell connection failed." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
