import test from "node:test";
import assert from "node:assert/strict";
import { buildCsp, generateNonce } from "../src/lib/csp.ts";

const dir = (csp, name) => csp.split("; ").find((d) => d.startsWith(name + " "));

test("produzione: solo script con nonce, niente unsafe-inline/unsafe-eval", () => {
  const csp = buildCsp({ nonce: "abc", isDev: false, convexUrl: "https://x.convex.cloud" });
  const script = dir(csp, "script-src");
  assert.match(script, /'nonce-abc'/);
  assert.match(script, /'strict-dynamic'/);
  assert.doesNotMatch(script, /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(dir(csp, "style-src"), /unsafe-inline/);
  assert.match(csp, /upgrade-insecure-requests/);
});
test("blocca incorporamenti, plugin e base tag", () => {
  const csp = buildCsp({ nonce: "n", isDev: false });
  assert.match(dir(csp, "frame-ancestors"), /'none'/);
  assert.match(dir(csp, "object-src"), /'none'/);
  assert.match(dir(csp, "base-uri"), /'self'/);
  assert.match(dir(csp, "form-action"), /'self'/);
});
test("Convex: connessione, WebSocket, immagini e anteprima PDF solo verso il proprio deployment", () => {
  const csp = buildCsp({ nonce: "n", isDev: false, convexUrl: "https://x.convex.cloud" });
  assert.match(dir(csp, "connect-src"), /https:\/\/x\.convex\.cloud wss:\/\/x\.convex\.cloud/);
  assert.match(dir(csp, "img-src"), /https:\/\/x\.convex\.cloud/);
  assert.match(dir(csp, "frame-src"), /^frame-src https:\/\/x\.convex\.cloud$/);
  assert.doesNotMatch(csp, /\*\.convex\.cloud/);
});
test("senza URL: dominio generico Convex, mai http: o *", () => {
  const csp = buildCsp({ nonce: "n", isDev: false });
  assert.match(dir(csp, "connect-src"), /\*\.convex\.cloud/);
  assert.doesNotMatch(csp, /\shttps?:(\s|;|$)/);
  assert.doesNotMatch(csp, /\s\*(\s|;|$)/);
});
test("sviluppo: unsafe-eval solo li', senza forzare https", () => {
  const csp = buildCsp({ nonce: "n", isDev: true });
  assert.match(dir(csp, "script-src"), /unsafe-eval/);
  assert.doesNotMatch(csp, /upgrade-insecure-requests/);
});
test("il nonce cambia a ogni richiesta e ha 128 bit", () => {
  const a = generateNonce();
  assert.notEqual(a, generateNonce());
  assert.equal(atob(a).length, 16);
});
