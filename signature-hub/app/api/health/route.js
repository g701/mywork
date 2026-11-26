import { driveReady } from "../../../lib/drive.js";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    app: "Signature Hub",
    ok: true,
    testMode: process.env.SIGNATURE_HUB_LIVE_ENABLED !== "true",
    signwell: Boolean(process.env.SIGNWELL_API_KEY),
    apiAuth: Boolean(process.env.SIGNATURE_HUB_API_KEY),
    drive: { ready: driveReady(), folderConfigured: Boolean(process.env.SIGNATURE_HUB_DRIVE_FOLDER_ID) },
    webhookReady: Boolean(process.env.SIGNATURE_HUB_WEBHOOK_TOKEN && process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
    liveSending: process.env.SIGNATURE_HUB_LIVE_ENABLED === "true",
  }, { headers: { "Cache-Control": "no-store" } });
}
