import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import { convexForServer } from "@/lib/convexServer";
import { NO_STORE, isSameOrigin, sessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Login: controlla le credenziali e imposta il cookie HttpOnly. Al browser NON arriva nessun token leggibile. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403, headers: NO_STORE });
  let body: { userId?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400, headers: NO_STORE });
  }
  if (typeof body.userId !== "string" || typeof body.password !== "string" || body.userId.length > 64 || body.password.length > 256) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400, headers: NO_STORE });
  }
  try {
    const res = await convexForServer().mutation(api.users.login, { userId: body.userId.trim(), password: body.password });
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 401, headers: NO_STORE });
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    response.headers.append("Set-Cookie", sessionCookie(res.sessionSecret, res.maxAgeSeconds));
    return response;
  } catch (e) {
    const tooMany = e instanceof Error && /Too many/.test(e.message);
    return NextResponse.json({ ok: false, error: tooMany ? "Too many attempts" : "Login unavailable" }, { status: tooMany ? 429 : 503, headers: NO_STORE });
  }
}
