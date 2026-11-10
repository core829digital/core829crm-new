import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { signSessionToken } from "./lib/jwt";
import { hashSecret } from "./lib/sessionSecret";

/**
 * Le funzioni pubbliche senza utente connesso sono `users.login`, `sessions.mint` e `sessions.revoke`:
 * si autenticano con il segreto di sessione (256 bit casuali, presente solo nel cookie HttpOnly), non con un token.
 */

const validSecret = (s: string) => s.length >= 32 && s.length <= 128;

/**
 * Scambia il segreto del cookie con un token breve (10 minuti) per Convex.
 * La chiama il server Next.js (route /api/auth/token), mai il JavaScript della pagina: non ha accesso al segreto.
 */
export const mint = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (!validSecret(args.secret)) return null;
    const hash = await hashSecret(args.secret);
    const session = await ctx.db.query("sessions").withIndex("by_secretHash", (q) => q.eq("secretHash", hash)).first();
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return null;
    }
    const user = await ctx.db.get(session.userId);
    if (!user) {
      await ctx.db.delete(session._id);
      return null;
    }
    const { token, expiresAt } = await signSessionToken(user._id, user.userId, session._id);
    return {
      token,
      expiresAt,
      user: { _id: user._id, userId: user.userId, name: user.name, surname: user.surname, role: user.role },
    };
  },
});

/** Logout: elimina la sessione. Sempre `ok`, cosi' non rivela se il segreto esisteva. */
export const revoke = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (validSecret(args.secret)) {
      const hash = await hashSecret(args.secret);
      const session = await ctx.db.query("sessions").withIndex("by_secretHash", (q) => q.eq("secretHash", hash)).first();
      if (session) await ctx.db.delete(session._id);
    }
    return { ok: true as const };
  },
});

/** Pulizia giornaliera delle sessioni scadute. */
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const old = await ctx.db.query("sessions").withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now())).take(500);
    for (const s of old) await ctx.db.delete(s._id);
    return old.length;
  },
});
