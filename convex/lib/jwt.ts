import { JWT_AUDIENCE, JWT_ISSUER, JWT_KEY_ID, SESSION_SECONDS } from "./authConst";

const b64url = (bytes: ArrayBuffer | Uint8Array | string): string => {
  const arr = typeof bytes === "string" ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Firma un token di sessione RS256 con la chiave privata (variabile CRM_JWT_PRIVATE_JWK). `sub` = id del documento utente. */
export async function signSessionToken(userDocId: string, userId: string): Promise<string> {
  const raw = process.env.CRM_JWT_PRIVATE_JWK;
  if (!raw) throw new Error("Server auth is not configured (CRM_JWT_PRIVATE_JWK missing). See docs/SECURITY-SERVER.md.");
  const key = await crypto.subtle.importKey("jwk", JSON.parse(raw), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: JWT_KEY_ID }));
  const payload = b64url(JSON.stringify({ iss: JWT_ISSUER, aud: JWT_AUDIENCE, sub: userDocId, userId, iat: now, exp: now + SESSION_SECONDS }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(sig)}`;
}
