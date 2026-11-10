/**
 * Password: PBKDF2-SHA256 (100.000 iterazioni) con sale casuale. I vecchi hash (SHA-256 semplice) restano validi
 * e vengono sostituiti da quelli nuovi al primo accesso riuscito.
 */
const ITERATIONS = 100_000;
const PREFIX = "pbkdf2$";

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ITERATIONS }, key, 256);
  return PREFIX + toHex(bits);
}

async function legacyHash(password: string, salt: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password + salt)));
}

/** Confronto a tempo costante. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyPassword(password: string, salt: string, stored: string): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (stored.startsWith(PREFIX)) return { ok: safeEqual(await hashPassword(password, salt), stored), needsUpgrade: false };
  return { ok: safeEqual(await legacyHash(password, salt), stored), needsUpgrade: true };
}

/** Regola minima per le nuove password. */
export function assertStrongPassword(pw: string): void {
  if (pw.length < 10) throw new Error("Password must be at least 10 characters.");
}
