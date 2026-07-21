import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const notifs = await ctx.db
      .query("notifications")
      .filter((q) =>
        args.userId
          ? q.eq(q.field("userId"), args.userId)
          : q.eq(q.field("userId"), undefined)
      )
      .collect();
    for (const n of notifs) {
      if (!n.isRead) await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listForUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("notifications")
      .order("desc")
      .take(args.limit ?? 50);
    return result.filter(
      (n) => n.userId === undefined || n.userId === args.userId
    );
  },
});

export const getUnreadCount = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const notifs = await ctx.db
      .query("notifications")
      .filter((q) =>
        args.userId
          ? q.eq(q.field("userId"), args.userId)
          : q.eq(q.field("userId"), undefined)
      )
      .collect();
    return notifs.filter((n) => !n.isRead).length;
  },
});
