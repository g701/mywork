export function validateRecipients(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) return { ok: false, error: "Add between 1 and 20 signers." };
  const recipients = input.map((r, i) => ({ id: String(i + 1), name: String(r?.name || "").trim(), email: String(r?.email || "").trim().toLowerCase() }));
  for (const r of recipients) {
    if (r.name.length < 1 || r.name.length > 120) return { ok: false, error: "Each signer needs a name (up to 120 characters)." };
    if (r.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return { ok: false, error: `Enter a valid email for signer ${r.id}.` };
  }
  if (new Set(recipients.map(r => r.email)).size !== recipients.length) return { ok: false, error: "Each signer must have a unique email address." };
  return { ok: true, recipients };
}

export function statusBucket(status = "") {
  if (status === "Completed") return "completed";
  if (status === "Draft") return "draft";
  if (["Sent", "In progress", "Pending"].includes(status)) return "awaiting";
  return "other";
}
