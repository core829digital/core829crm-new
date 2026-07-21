import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByLeadId = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .first();
  },
});

export const create = mutation({
  args: {
    leadId: v.optional(v.id("leads")),
    clientName: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("clients", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    await notify(ctx, {
      type: "client_created",
      title: "New Client Created",
      message: `${args.clientName} (${args.company})`,
      link: "/",
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    clientName: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});
