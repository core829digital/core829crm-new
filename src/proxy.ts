import { NextRequest, NextResponse } from "next/server";
import { buildCsp, generateNonce } from "@/lib/csp";
import { SESSION_COOKIE } from "@/lib/session";

/** Il CRM e' fatto di pagine: bastano questi metodi. Tutto il resto viene rifiutato prima di arrivare all'app. */
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return new NextResponse(null, { status: 405, headers: { Allow: "GET, HEAD, POST, OPTIONS" } });
  }

  // Primo filtro (comodita'): senza cookie di sessione si va direttamente al login. La protezione vera dei dati
  // e' nel database, che controlla il token ad ogni richiesta.
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth/") || /\.[a-zA-Z0-9]+$/.test(pathname);
  if (!isPublic && !request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV === "development", convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL });

  // Next.js legge il nonce dall'header CSP della richiesta e lo applica ai propri script.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
