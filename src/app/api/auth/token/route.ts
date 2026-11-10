import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import { convexForServer } from "@/lib/convexServer";
import { NO_STORE, clearedSessionCookie, isSameOrigin, readSessionSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Restituisce un token BREVE (10 minuti) per parlare con Convex e i dati dell'utente.
 * Il segreto di lunga durata resta nel cookie HttpOnly: la pagina non lo vede mai.
 */
export async function GET(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  const secret = readSessionSecret(request);
  if (!secret) return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: NO_STORE });
  try {
    const minted = await convexForServer().mutation(api.sessions.mint, { secret });
    if (!minted) {
      const r = NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: NO_STORE });
      r.headers.append("Set-Cookie", clearedSessionCookie());
      return r;
    }
    return NextResponse.json(minted, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: NO_STORE });
  }
}
