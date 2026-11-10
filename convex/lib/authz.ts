import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;

export const ADMIN_USER_ID = "00001";

/**
 * L'utente connesso, ricavato dal token firmato dal server (mai da un argomento della chiamata).
 * Rifiuta chi non e' connesso e chi e' stato eliminato nel frattempo.
 */
export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const id = ctx.db.normalizeId("users", identity.subject);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.userId !== ADMIN_USER_ID) throw new Error("Administrator only");
  return user;
}

/** Il parametro `userId` inviato dal browser e' accettato solo se coincide con l'utente connesso. */
export function assertSelf(me: Doc<"users">, userId: string | undefined): void {
  if (userId !== undefined && userId !== me.userId) throw new Error("Forbidden");
}
