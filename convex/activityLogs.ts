import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const log = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: args.userName,
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
    return await ctx.db
      .query("activityLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
