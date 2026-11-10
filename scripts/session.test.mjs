import test from "node:test";
import assert from "node:assert/strict";
import { SESSION_COOKIE, clearedSessionCookie, isSameOrigin, sessionCookie } from "../src/lib/session.ts";

const req = (headers) => ({ headers: new Headers(headers) });

test("il cookie e' HttpOnly, SameSite=Strict, su tutto il sito", () => {
  const c = sessionCookie("abc", 3600);
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Strict/);
  assert.match(c, /Path=\//);
  assert.match(c, /Max-Age=3600/);
  assert.ok(c.startsWith(SESSION_COOKIE + "=abc"));
  assert.doesNotMatch(c, /Domain=/);
});
test("il cookie di logout scade subito e resta HttpOnly", () => {
  const c = clearedSessionCookie();
  assert.match(c, /Max-Age=0/);
  assert.match(c, /HttpOnly/);
});
test("accetta solo richieste dello stesso sito", () => {
  assert.equal(isSameOrigin(req({ host: "crm.x.it", origin: "https://crm.x.it", "sec-fetch-site": "same-origin" })), true);
  assert.equal(isSameOrigin(req({ host: "crm.x.it" })), true); // nessun Origin (es. navigazione diretta)
  assert.equal(isSameOrigin(req({ host: "crm.x.it", origin: "https://evil.example" })), false);
  assert.equal(isSameOrigin(req({ host: "crm.x.it", "sec-fetch-site": "cross-site" })), false);
  assert.equal(isSameOrigin(req({ host: "crm.x.it", "sec-fetch-site": "same-site" })), false);
  assert.equal(isSameOrigin(req({ host: "crm.x.it", origin: "not a url" })), false);
  assert.equal(isSameOrigin(req({ host: "crm.x.it", "x-forwarded-host": "crm.y.it", origin: "https://crm.y.it" })), true);
});
