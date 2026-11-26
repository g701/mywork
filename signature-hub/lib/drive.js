export function driveReady() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.SIGNATURE_HUB_DRIVE_FOLDER_ID);
}

async function accessToken() {
  const form = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error("Google Drive authorization failed. Check the OAuth settings in Vercel.");
  return result.access_token;
}

export async function archivePdf({ documentId, filename, pdf }) {
  if (!driveReady()) throw new Error("Google Drive archiving is not configured yet.");
  const token = await accessToken();
  const boundary = `signaturehub_${crypto.randomUUID().replaceAll("-", "")}`;
  const metadata = JSON.stringify({ name: filename, mimeType: "application/pdf", parents: [process.env.SIGNATURE_HUB_DRIVE_FOLDER_ID], appProperties: { signwellDocumentId: documentId, source: "Signature Hub" } });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`), pdf,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Google Drive upload failed. Check that the folder is writable by the configured OAuth account.");
  return data;
}
