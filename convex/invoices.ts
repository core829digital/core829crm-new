import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    invoiceNumber: v.string(),
    amount: v.number(),
    status: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("invoices", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    await notify(ctx, {
      type: "invoice_created",
      title: "New Invoice Created",
      message: `${args.invoiceNumber} — $${args.amount.toLocaleString()}`,
      link: "/",
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    invoiceNumber: v.optional(v.string()),
    amount: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
    if (updates.status) {
      await notify(ctx, {
        type: "invoice_status",
        title: `Invoice ${updates.status}`,
        message: `${args.invoiceNumber || id} — status: ${updates.status}`,
        link: "/",
      });
    }
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (invoice?.fileId) {
      await ctx.storage.delete(invoice.fileId);
    }
    await ctx.db.delete(args.id);
  },
});
