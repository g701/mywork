# Signature Hub

Signature Hub is a Vercel-hosted Next.js workspace for preparing and tracking SignWell requests. All create and send operations are hard-coded to SignWell Test Mode; this release has no live-send path.

## Included

- PDF upload to an unsent SignWell draft, with SignWell's `with_signature_page` option adding a signature page for every signer.
- Multiple signers, optional sequential signing order, and native SignWell reminders (day 3, 6, and 10).
- Live document and signer status via SignWell API polling.
- Bearer-authenticated REST endpoints and an HTTP JSON-RPC MCP endpoint at `/api/mcp`.
- SignWell completion webhook endpoint and automatic completed-PDF upload to a selected Google Drive folder when Drive OAuth is configured.
- Vercel SSO protects the project; the setup route returns the generated Signature Hub API key only from a deployed Vercel runtime.

## Vercel environment

Required: `SIGNWELL_API_KEY`, `SIGNATURE_HUB_API_KEY`, and `SIGNATURE_HUB_WEBHOOK_TOKEN` (all sensitive). Drive archiving also needs `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, and `SIGNATURE_HUB_DRIVE_FOLDER_ID` (folder ID for the `Signature Hub` folder created in Drive). Set `NEXT_PUBLIC_APP_URL` to the stable production URL to register the SignWell webhook. The app does not store PDFs or document state in its filesystem; SignWell is the system of record.

## API

- `GET /api/health` — non-secret integration status.
- `GET /api/documents` — list documents and signer status.
- `POST /api/documents` — multipart fields: `file`, `name`, `recipients` (JSON array), and optional `applySigningOrder`. Creates a test-mode draft only.
- `GET /api/documents/{id}` — current document and signer state.
- `POST /api/documents/{id}/send` — sends a test-mode invitation only.
- `POST /api/documents/{id}/remind` — sends a reminder to unsigned recipients.
- `POST /api/webhooks/register` — register completion callback with SignWell.
- `POST /api/mcp` — JSON-RPC MCP methods `initialize`, `tools/list`, and `tools/call`.

Every route except health and the Vercel-SSO protected access-key bootstrap requires `Authorization: Bearer <SIGNATURE_HUB_API_KEY>`. Live signing is intentionally unavailable in this release.

## Local checks

Run `node --test` and `npm run build`.
