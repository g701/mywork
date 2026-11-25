import { hasValidApiKey, unauthorized } from "../../../lib/security.js";
import { signwell } from "../../../lib/signwell.js";
import { validateRecipients } from "../../../lib/validation.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!hasValidApiKey(request)) return unauthorized();
  try {
    const { body } = await signwell("/documents");
    const documents = Array.isArray(body) ? body : (body?.documents || body?.data || []);
    return Response.json({ documents, testMode: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}

export async function POST(request) {
  if (!hasValidApiKey(request)) return unauthorized();
  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "Signature request").trim().slice(0, 180);
    let inputRecipients;
    try { inputRecipients = JSON.parse(String(form.get("recipients") || "[]")); } catch { return Response.json({ error: "Signer list is invalid." }, { status: 400 }); }
    const validated = validateRecipients(inputRecipients);
    if (!validated.ok) return Response.json({ error: validated.error }, { status: 400 });
    if (!(file instanceof File) || file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return Response.json({ error: "Upload a PDF file." }, { status: 400 });
    if (file.size < 100 || file.size > 4 * 1024 * 1024) return Response.json({ error: "PDF must be between 100 bytes and 4 MB." }, { status: 413 });
    const pdf = Buffer.from(await file.arrayBuffer());
    if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") return Response.json({ error: "The file does not contain a valid PDF header." }, { status: 400 });
    const payload = {
      test_mode: true,
      draft: true,
      name,
      files: [{ name: file.name.slice(0, 180), file_base64: pdf.toString("base64") }],
      recipients: validated.recipients,
      with_signature_page: true,
      reminders: true,
      apply_signing_order: String(form.get("applySigningOrder")) === "true",
      metadata: { signature_hub: true },
    };
    const { body } = await signwell("/documents", { method: "POST", body: JSON.stringify(payload) });
    return Response.json({ document: body, testMode: true, sent: false }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
}
