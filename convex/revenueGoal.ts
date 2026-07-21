import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";

export const setGoal = mutation({
  args: {
    month: v.string(),
    monthlyGoal: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("revenueGoals")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { monthlyGoal: args.monthlyGoal });
    } else {
      await ctx.db.insert("revenueGoals", args);
    }
    await notify(ctx, {
      type: "goal_set",
      title: "Revenue Goal Updated",
      message: `${args.month}: $${args.monthlyGoal.toLocaleString()}`,
    });
  },
});

export const checkGoalReached = mutation({
  args: {
    month: v.string(),
    currentRevenue: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db
      .query("revenueGoals")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
    if (goal && args.currentRevenue >= goal.monthlyGoal) {
      await notify(ctx, {
        type: "goal_reached",
        title: "Revenue Goal Reached!",
        message: `${args.month}: $${args.currentRevenue.toLocaleString()} (goal: $${goal.monthlyGoal.toLocaleString()})`,
      });
    }
  },
});

export const getGoal = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const goal = await ctx.db
      .query("revenueGoals")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
    return goal?.monthlyGoal ?? 0;
  },
});

export const getAllMonths = query({
  handler: async (ctx) => {
    const goals = await ctx.db.query("revenueGoals").collect();
    return goals.map((g) => ({ month: g.month, goal: g.monthlyGoal }));
  },
});
