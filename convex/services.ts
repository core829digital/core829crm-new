import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";
import { requireUser } from "./lib/authz";

export { serviceCategories } from "./lib/catalog";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("services")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    category: v.string(),
    serviceName: v.string(),
    description: v.optional(v.string()),
    quoteAmount: v.number(),
    quoteFileId: v.optional(v.id("_storage")),
    quoteFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const id = await ctx.db.insert("services", {
      ...args,
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
    await notify(ctx, {
      type: "service_added",
      title: "Service / Quote Added",
      message: `${args.serviceName} (${args.category}) — $${args.quoteAmount.toLocaleString()}`,
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("services"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const service = await ctx.db.get(args.id);
    if (!service) throw new Error("Service not found");

    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "Accepted") {
      const client = await ctx.db.get(service.clientId);
      if (client?.leadId) {
        const lead = await ctx.db.get(client.leadId);
        if (lead && lead.leadStatus !== "Won") {
          await ctx.db.patch(client.leadId, { leadStatus: "Won" });
        }
      }
      await notify(ctx, {
        type: "service_accepted",
        title: "Service / Quote Accepted",
        message: `${service.serviceName} accepted — $${service.quoteAmount.toLocaleString()}`,
      });
    }
    if (args.status === "Declined") {
      await notify(ctx, {
        type: "service_declined",
        title: "Service / Quote Declined",
        message: `${service.serviceName} was declined`,
      });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("services"),
    category: v.optional(v.string()),
    serviceName: v.optional(v.string()),
    description: v.optional(v.string()),
    quoteAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) if (val !== undefined) updates[k] = val;
    if (Object.keys(updates).length) await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const service = await ctx.db.get(args.id);
    if (service?.quoteFileId) {
      await ctx.storage.delete(service.quoteFileId);
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
