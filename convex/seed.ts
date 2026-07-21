import { mutation } from "./_generated/server";

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", "00001"))
      .first();

    const salt = generateSalt();
    const passwordHash = await hashPassword("STEFANdenis@2026", salt);

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: "Stefan",
        surname: "Serban",
        passwordHash,
        salt,
        role: "Founder / CEO",
      });
      return { created: false, message: "Admin updated: Stefan Serban, Founder / CEO" };
    }

    await ctx.db.insert("users", {
      userId: "00001",
      name: "Stefan",
      surname: "Serban",
      passwordHash,
      salt,
      role: "Founder / CEO",
      createdBy: undefined,
      createdAt: new Date().toISOString(),
    });

    return { created: true, message: "Admin account created: Stefan Serban, Founder / CEO" };
  },
});
