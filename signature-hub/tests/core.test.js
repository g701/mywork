import test from "node:test";
import assert from "node:assert/strict";
import { hasValidApiKey } from "../lib/security.js";
import { statusBucket, validateRecipients } from "../lib/validation.js";

test("API auth requires a matching bearer token", () => {
  const req = value => new Request("https://example.test/api", { headers: value ? { Authorization: value } : {} });
  assert.equal(hasValidApiKey(req("Bearer abc"), "abc"), true);
  assert.equal(hasValidApiKey(req("Bearer abC"), "abc"), false);
  assert.equal(hasValidApiKey(req("abc"), "abc"), false);
  assert.equal(hasValidApiKey(req("Bearer abc"), ""), false);
});

test("signers are normalized and validated", () => {
  const ok = validateRecipients([{ name: "  Ada Lovelace ", email: "ADA@example.com" }, { name: "Grace", email: "grace@example.com" }]);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.recipients.map(x => [x.id,x.name,x.email]), [["1","Ada Lovelace","ada@example.com"],["2","Grace","grace@example.com"]]);
  assert.equal(validateRecipients([{ name: "Ada", email: "bad" }]).ok, false);
  assert.equal(validateRecipients([{ name: "Ada", email: "a@example.com" }, { name: "B", email: "A@example.com" }]).ok, false);
  assert.equal(validateRecipients([]).ok, false);
});

test("document states map to the dashboard buckets", () => {
  assert.equal(statusBucket("Completed"), "completed");
  assert.equal(statusBucket("Draft"), "draft");
  assert.equal(statusBucket("In progress"), "awaiting");
  assert.equal(statusBucket("Canceled"), "other");
});
