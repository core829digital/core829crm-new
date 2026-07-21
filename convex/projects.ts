import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByClientId = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    projectName: v.string(),
    description: v.string(),
    status: v.string(),
    startDate: v.string(),
    deadline: v.optional(v.string()),
    totalValue: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("projects", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    projectName: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    deadline: v.optional(v.string()),
    totalValue: v.optional(v.number()),
    notes: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addTask = mutation({
  args: {
    projectId: v.id("projects"),
    taskName: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("projectTasks", {
      projectId: args.projectId,
      taskName: args.taskName,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const toggleTask = mutation({
  args: {
    id: v.id("projectTasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: args.completed });
  },
});

export const removeTask = mutation({
  args: { id: v.id("projectTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectTasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});
