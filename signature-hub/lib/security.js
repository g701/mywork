import { timingSafeEqual } from "node:crypto";

export function hasValidApiKey(request, expected = process.env.SIGNATURE_HUB_API_KEY) {
  if (!expected) return false;
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  if (!match) return false;
  const actual = Buffer.from(match[1]);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
}
