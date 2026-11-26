import { hasValidApiKey, unauthorized } from "../../../lib/security.js";
import { signwell } from "../../../lib/signwell.js";
import { validateRecipients } from "../../../lib/validation.js";

export const dynamic = "force-dynamic";

const tools = [
  { name: "list_documents", description: "List the SignWell documents and live statuses. Signature Hub always filters behavior to test mode.", inputSchema: { type: "object", properties: {} } },
  { name: "get_document", description: "Retrieve current document, signer, and field status from SignWell.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "create_test_draft", description: "Create an unsent test-mode PDF draft. A SignWell signature page is automatically appended for all signers.", inputSchema: { type: "object", properties: { name: { type: "string" }, file_name: { type: "string" }, file_base64: { type: "string" }, signers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, email: { type: "string" } }, required: ["name", "email"] } }, signing_order: { type: "boolean" } }, required: ["file_name", "file_base64", "signers"] } },
  { name: "send_test_request", description: "Send a non-binding SignWell test-mode invitation. SignWell may email the listed signers. Live sending is disabled.", inputSchema: { type: "object", properties: { id: { type: "string" }, reminders: { type: "boolean" } }, required: ["id"] } },
  { name: "send_reminder", description: "Ask SignWell to remind recipients who have not signed. Use only when a reminder is intended to be sent.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
];

const reply = (id, result) => Response.json({ jsonrpc: "2.0", id, result });
const error = (id, code, message) => Response.json({ jsonrpc: "2.0", id, error: { code, message } });

export async function GET(request) {
  if (!hasValidApiKey(request)) return unauthorized();
  return Response.json({ name: "signature-hub", version: "1.0.0", transport: "streamable-http", protocolVersion: "2025-03-26", tools: tools.map(t => t.name) });
}

export async function POST(request) {
  if (!hasValidApiKey(request)) return unauthorized();
  const input = await request.json().catch(() => null);
  if (!input || input.jsonrpc !== "2.0") return error(input?.id ?? null, -32600, "Invalid JSON-RPC request");
  const { id, method, params = {} } = input;
  if (method === "initialize") return reply(id, { protocolVersion: params.protocolVersion || "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "signature-hub", version: "1.0.0" } });
  if (method === "notifications/initialized") return new Response(null, { status: 202 });
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools });
  if (method !== "tools/call") return error(id, -32601, "Method not found");
  const name = params.name;
  const args = params.arguments || {};
  try {
    let result;
    if (name === "list_documents") {
      const { body } = await signwell("/documents");
      result = { documents: Array.isArray(body) ? body : (body?.documents || body?.data || []), testMode: true };
    } else if (name === "get_document") {
      if (!args.id) throw Object.assign(new Error("id is required"), { status: 400 });
      result = (await signwell(`/documents/${encodeURIComponent(args.id)}`)).body;
    } else if (name === "create_test_draft") {
      const validated = validateRecipients(args.signers);
      if (!validated.ok) throw Object.assign(new Error(validated.error), { status: 400 });
      const filename = String(args.file_name || "document.pdf").slice(0, 180);
      const b64 = String(args.file_base64 || "").replace(/^data:application\/pdf;base64,/, "");
      const pdf = Buffer.from(b64, "base64");
      if (!filename.toLowerCase().endsWith(".pdf") || pdf.length < 100 || pdf.length > 4 * 1024 * 1024 || pdf.subarray(0,5).toString("ascii") !== "%PDF-") throw Object.assign(new Error("Provide a valid PDF under 4 MB as file_base64."), { status: 400 });
      const body = { test_mode: true, draft: true, name: String(args.name || filename.replace(/\.pdf$/i, "")).slice(0,180), files: [{ name: filename, file_base64: pdf.toString("base64") }], recipients: validated.recipients, with_signature_page: true, reminders: true, apply_signing_order: args.signing_order === true, metadata: { signature_hub: true } };
      result = (await signwell("/documents", { method: "POST", body: JSON.stringify(body) })).body;
    } else if (name === "send_test_request") {
      if (!args.id) throw Object.assign(new Error("id is required"), { status: 400 });
      result = (await signwell(`/documents/${encodeURIComponent(args.id)}/send`, { method: "POST", body: JSON.stringify({ test_mode: true, reminders: args.reminders !== false }) })).body;
    } else if (name === "send_reminder") {
      if (!args.id) throw Object.assign(new Error("id is required"), { status: 400 });
      result = (await signwell(`/documents/${encodeURIComponent(args.id)}/remind`, { method: "POST", body: JSON.stringify({}) })).body;
    } else return error(id, -32602, "Unknown tool");
    return reply(id, { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
  } catch (e) {
    const status = e.status || 500;
    return reply(id, { isError: true, content: [{ type: "text", text: e.message }], _meta: { httpStatus: status } });
  }
}
