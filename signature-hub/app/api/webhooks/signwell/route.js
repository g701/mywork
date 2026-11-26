import { driveReady, archivePdf } from "../../../../lib/drive.js";
import { getCompletedPdf } from "../../../../lib/signwell.js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const expected = process.env.SIGNATURE_HUB_WEBHOOK_TOKEN;
  const provided = new URL(request.url).searchParams.get("token") || "";
  if (!expected || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const event = await request.json().catch(() => null);
  const eventType = event?.event?.type;
  const doc = event?.data?.object;
  if (eventType !== "document_completed" || !doc?.id || doc?.metadata?.signature_hub !== "true") return Response.json({ received: true, archived: false });
  if (!driveReady()) return Response.json({ received: true, archived: false, reason: "Drive integration is not configured." });
  try {
    const pdf = await getCompletedPdf(doc.id);
    const safeName = String(doc.name || "Signed document").replace(/[\\/:*?"<>|]/g, "-").slice(0, 130);
    const file = await archivePdf({ documentId: doc.id, filename: `${safeName} - signed.pdf`, pdf });
    return Response.json({ received: true, archived: true, fileId: file.id });
  } catch (e) {
    return Response.json({ received: true, archived: false, error: e.message }, { status: 503 });
  }
}
