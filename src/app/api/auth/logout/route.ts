import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import { convexForServer } from "@/lib/convexServer";
import { NO_STORE, clearedSessionCookie, isSameOrigin, readSessionSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Logout: elimina la sessione dal database (non basta cancellare il cookie) e svuota il cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403, headers: NO_STORE });
  const secret = readSessionSecret(request);
  if (secret) {
    try {
      await convexForServer().mutation(api.sessions.revoke, { secret });
    } catch {
      // Anche se il database non risponde, il cookie viene comunque cancellato.
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
  response.headers.append("Set-Cookie", clearedSessionCookie());
  return response;
}
