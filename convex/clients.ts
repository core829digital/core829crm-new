import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";
import { requireAdmin, requireUser } from "./lib/authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("clients").collect();
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByLeadId = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
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
    category: v.optional(v.string()),
    niche: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    pec: v.optional(v.string()),
    vatId: v.optional(v.string()),
    legalRep: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
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
    category: v.optional(v.string()),
    niche: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    pec: v.optional(v.string()),
    vatId: v.optional(v.string()),
    legalRep: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

/**
 * Elimina un cliente con tutto cio' che gli appartiene (progetti, attivita', fatture, servizi e relativi file).
 * Il lead di origine NON viene toccato.
 */
export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const client = await ctx.db.get(args.id);
    if (!client) return { projects: 0, services: 0 };
    const projects = await ctx.db.query("projects").withIndex("by_clientId", (q) => q.eq("clientId", args.id)).collect();
    for (const p of projects) {
      for (const t of await ctx.db.query("projectTasks").withIndex("by_projectId", (q) => q.eq("projectId", p._id)).collect()) await ctx.db.delete(t._id);
      for (const i of await ctx.db.query("invoices").withIndex("by_projectId", (q) => q.eq("projectId", p._id)).collect()) {
        if (i.fileId) await ctx.storage.delete(i.fileId);
        await ctx.db.delete(i._id);
      }
      await ctx.db.delete(p._id);
    }
    const services = await ctx.db.query("services").withIndex("by_clientId", (q) => q.eq("clientId", args.id)).collect();
    for (const sv of services) {
      if (sv.quoteFileId) await ctx.storage.delete(sv.quoteFileId);
      await ctx.db.delete(sv._id);
    }
    await ctx.db.delete(args.id);
    await notify(ctx, { type: "client_deleted", title: "Client Deleted", message: `${client.clientName} (${client.company})`, link: "/" });
    return { projects: projects.length, services: services.length };
  },
});
