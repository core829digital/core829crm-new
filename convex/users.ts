import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

function generateUserId(): string {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return String(n);
}

export const login = mutation({
  args: {
    userId: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) throw new Error("Invalid credentials");

    const hash = await hashPassword(args.password, user.salt);
    if (hash !== user.passwordHash) throw new Error("Invalid credentials");

    return {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      surname: user.surname,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});

export const createUser = mutation({
  args: {
    adminUserId: v.string(),
    name: v.string(),
    surname: v.string(),
    password: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminUserId !== "00001") throw new Error("Only admin can create users");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();
    if (!existing) throw new Error("Admin not found");

    const newUserId = generateUserId();
    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);

    await ctx.db.insert("users", {
      userId: newUserId,
      name: args.name,
      surname: args.surname,
      passwordHash,
      salt,
      role: args.role,
      createdBy: args.adminUserId,
      createdAt: new Date().toISOString(),
    });

    return newUserId;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      userId: u.userId,
      name: u.name,
      surname: u.surname,
      role: u.role,
      createdBy: u.createdBy,
      createdAt: u.createdAt,
    }));
  },
});

export const updateUser = mutation({
  args: {
    adminUserId: v.string(),
    id: v.id("users"),
    name: v.optional(v.string()),
    surname: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminUserId !== "00001") throw new Error("Only admin can update users");

    const { id, password, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    if (password) {
      const existing = await ctx.db.get(id);
      if (!existing) throw new Error("User not found");
      const salt = generateSalt();
      updates.passwordHash = await hashPassword(password, salt);
      updates.salt = salt;
    }
    await ctx.db.patch(id, updates);
  },
});

export const changePassword = mutation({
  args: {
    userId: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) throw new Error("User not found");

    const hash = await hashPassword(args.currentPassword, user.salt);
    if (hash !== user.passwordHash) throw new Error("Current password incorrect");

    const newSalt = generateSalt();
    const newHash = await hashPassword(args.newPassword, newSalt);
    await ctx.db.patch(user._id, { passwordHash: newHash, salt: newSalt });
  },
});
