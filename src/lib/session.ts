import type { NextRequest } from "next/server";

/**
 * Cookie di sessione: HttpOnly (il JavaScript della pagina non lo puo' leggere), Secure, SameSite=Strict.
 * In produzione usa il prefisso `__Host-`, che il browser accetta solo se Secure, senza Domain e con Path=/.
 */
const isProd = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = isProd ? "__Host-crm_session" : "crm_session";

export function sessionCookie(value: string, maxAgeSeconds: number): string {
  return [`${SESSION_COOKIE}=${value}`, "Path=/", `Max-Age=${maxAgeSeconds}`, "HttpOnly", "SameSite=Strict", ...(isProd ? ["Secure"] : [])].join("; ");
}

export function clearedSessionCookie(): string {
  return sessionCookie("", 0);
}

export function readSessionSecret(request: NextRequest): string | null {
  const v = request.cookies.get(SESSION_COOKIE)?.value;
  return v && v.length >= 32 && v.length <= 128 && /^[A-Za-z0-9_-]+$/.test(v) ? v : null;
}

/**
 * Difesa dagli attacchi CSRF (un altro sito che prova a far chiamare queste route al tuo browser):
 * accetta solo richieste dello stesso sito. SameSite=Strict sul cookie e' il primo muro, questo il secondo.
 */
export function isSameOrigin(request: Pick<NextRequest, "headers">): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } as const;
