import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertSelf, requireAdmin, requireUser } from "./lib/authz";

export const log = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    assertSelf(me, args.userId);
    await ctx.db.insert("activityLogs", {
      userId: me.userId,
      userName: `${me.name} ${me.surname}`,
      action: args.action,
      details: args.details,
      timestamp: new Date().toISOString(),
    });
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    if (args.limit) logs = logs.slice(0, args.limit);
    return logs;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("activityLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
