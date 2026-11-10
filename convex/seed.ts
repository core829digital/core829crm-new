import { internalMutation } from "./_generated/server";
import { generateSalt, hashPassword } from "./lib/password";

/**
 * Crea l'amministratore iniziale (ID 00001). NON e' piu' una funzione pubblica e non contiene piu' nessuna password:
 * la password iniziale arriva dalla variabile CRM_ADMIN_INITIAL_PASSWORD (poi si cambia dal profilo).
 *   npx convex env set CRM_ADMIN_INITIAL_PASSWORD "<password lunga>"
 *   npx convex run seed:seedAdmin
 */
export const seedAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", "00001")).first();
    if (existing) return { created: false, message: "Admin already exists. Skipping seed." };

    const password = process.env.CRM_ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 12) throw new Error("Set CRM_ADMIN_INITIAL_PASSWORD (min 12 characters) first.");
    const salt = generateSalt();
    await ctx.db.insert("users", {
      userId: "00001",
      name: "Stefan",
      surname: "Serban",
      passwordHash: await hashPassword(password, salt),
      salt,
      role: "Founder / CEO",
      createdBy: undefined,
      createdAt: new Date().toISOString(),
    });
    return { created: true, message: "Admin account created: Stefan Serban, Founder / CEO" };
  },
});

/**
 * Emergenza: se hai perso la password dell'amministratore (00001). Legge la nuova password da CRM_ADMIN_INITIAL_PASSWORD,
 * la imposta e chiude tutte le sue sessioni.
 *   npx convex env set CRM_ADMIN_INITIAL_PASSWORD "<nuova password lunga>"
 *   npx convex run seed:resetAdminPassword
 *   npx convex env remove CRM_ADMIN_INITIAL_PASSWORD
 */
export const resetAdminPassword = internalMutation({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", "00001")).first();
    if (!admin) throw new Error("Admin 00001 not found: run seed:seedAdmin instead.");
    const password = process.env.CRM_ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 12) throw new Error("Set CRM_ADMIN_INITIAL_PASSWORD (min 12 characters) first.");
    const salt = generateSalt();
    await ctx.db.patch(admin._id, { salt, passwordHash: await hashPassword(password, salt) });
    for (const s of await ctx.db.query("sessions").withIndex("by_userId", (q) => q.eq("userId", admin._id)).collect()) await ctx.db.delete(s._id);
    return { ok: true };
  },
});
