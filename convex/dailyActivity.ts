import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logActivity = mutation({
  args: {
    setterName: v.string(),
    date: v.string(),
    dialsDMsent: v.number(),
    conversations: v.number(),
    callsScheduled: v.number(),
    callsTaken: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyActivities")
      .withIndex("by_setter_date", (q) =>
        q.eq("setterName", args.setterName).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dialsDMsent: args.dialsDMsent,
        conversations: args.conversations,
        callsScheduled: args.callsScheduled,
        callsTaken: args.callsTaken,
      });
    } else {
      await ctx.db.insert("dailyActivities", args);
    }
  },
});

export const getActivity = query({
  args: {
    setterName: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let activities = await ctx.db.query("dailyActivities").collect();

    if (args.setterName) {
      activities = activities.filter(
        (a) => a.setterName === args.setterName
      );
    }
    if (args.dateFrom) {
      activities = activities.filter((a) => a.date >= args.dateFrom!);
    }
    if (args.dateTo) {
      activities = activities.filter((a) => a.date <= args.dateTo!);
    }

    return activities;
  },
});

export const getSetters = query({
  handler: async (ctx) => {
    const activities = await ctx.db.query("dailyActivities").collect();
    const names = [...new Set(activities.map((a) => a.setterName))];
    return names.sort();
  },
});
