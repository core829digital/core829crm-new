import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";

async function assertMember(ctx: any, conversationId: any, userId: string) {
  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversation", (q: any) => q.eq("conversationId", conversationId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();
  if (!member) throw new Error("Not a member of this conversation");
  return member;
}

async function assertAdmin(ctx: any, conversationId: any, userId: string) {
  const member = await assertMember(ctx, conversationId, userId);
  if (member.role !== "admin") throw new Error("Admin access required");
  return member;
}

export const listForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const conversationIds = memberships.map((m) => m.conversationId);
    if (conversationIds.length === 0) return [];

    const conversations = await Promise.all(
      conversationIds.map((id) => ctx.db.get(id))
    );
    const valid = conversations.filter(Boolean).sort((a, b) => {
      const aTime = a!.lastMessageAt || a!.createdAt;
      const bTime = b!.lastMessageAt || b!.createdAt;
      return bTime.localeCompare(aTime);
    });

    const result = await Promise.all(
      valid.map(async (conv) => {
        const receipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", conv!._id).eq("userId", args.userId)
          )
          .first();
        const since = receipt?.lastReadAt || "1970-01-01T00:00:00.000Z";
        const unread = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv!._id).gt("createdAt", since)
          )
          .filter((q) => q.neq(q.field("senderId"), args.userId))
          .collect();

        let displayName = conv!.name || "";
        if (conv!.type === "direct") {
          const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv!._id))
            .collect();
          const other = members.find((m) => m.userId !== args.userId);
          displayName = other?.userName || displayName;
        }

        return {
          ...conv,
          displayName,
          unreadCount: unread.length,
        };
      })
    );

    return result;
  },
});

export const getById = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;

    let displayName = conv.name || "";
    if (conv.type === "direct") {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      const other = members.find((m) => m.userId !== args.userId);
      displayName = other?.userName || displayName;
    }

    return { ...conv, displayName };
  },
});

export const createDirect = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    otherUserId: v.string(),
    otherUserName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const existingIds = existing.map((m) => m.conversationId);
    for (const id of existingIds) {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", id))
        .collect();
      const userIds = members.map((m) => m.userId).sort();
      if (
        userIds.length === 2 &&
        userIds.includes(args.userId) &&
        userIds.includes(args.otherUserId)
      ) {
        return id;
      }
    }

    const convId = await ctx.db.insert("conversations", {
      type: "direct",
      createdBy: args.userId,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("conversationMembers", {
      conversationId: convId,
      userId: args.userId,
      userName: args.userName,
      joinedAt: new Date().toISOString(),
      role: "member",
    });
    await ctx.db.insert("conversationMembers", {
      conversationId: convId,
      userId: args.otherUserId,
      userName: args.otherUserName,
      joinedAt: new Date().toISOString(),
      role: "member",
    });

    return convId;
  },
});

export const createGroup = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    name: v.string(),
    memberIds: v.array(v.string()),
    leadId: v.optional(v.id("leads")),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const nameMap = new Map(allUsers.map((u) => [u.userId, `${u.name} ${u.surname}`]));
    const allMemberIds = [args.userId, ...args.memberIds.filter((id) => id !== args.userId)];

    const convId = await ctx.db.insert("conversations", {
      name: args.name,
      type: args.leadId ? "lead" : "group",
      leadId: args.leadId,
      createdBy: args.userId,
      createdAt: new Date().toISOString(),
    });

    for (const uid of allMemberIds) {
      await ctx.db.insert("conversationMembers", {
        conversationId: convId,
        userId: uid,
        userName: nameMap.get(uid) || uid,
        joinedAt: new Date().toISOString(),
        role: uid === args.userId ? "admin" : "member",
      });
    }

    await notify(ctx, {
      type: "chat_group_created",
      title: "New Chat Group",
      message: `${args.userName} created "${args.name}"`,
    });

    return convId;
  },
});

export const addMember = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    newUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.conversationId, args.userId);
    const existing = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.newUserId))
      .first();
    if (existing) throw new Error("User already a member");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.newUserId))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId: args.newUserId,
      userName: `${user.name} ${user.surname}`,
      joinedAt: new Date().toISOString(),
      role: "member",
    });
  },
});

export const removeMember = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.conversationId, args.userId);
    if (args.userId === args.targetUserId) throw new Error("Cannot remove yourself");

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.targetUserId))
      .first();
    if (!member) throw new Error("Member not found");

    await ctx.db.delete(member._id);

    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: args.userId,
      action: "Removed member from chat",
      details: `Removed user ${args.targetUserId} from conversation ${args.conversationId}`,
      timestamp: new Date().toISOString(),
    });
  },
});

export const leave = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!member) throw new Error("Not a member");
    await ctx.db.delete(member._id);
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    const users = await ctx.db.query("users").collect();
    const q = args.query.toLowerCase();
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.surname.toLowerCase().includes(q) ||
          `${u.name} ${u.surname}`.toLowerCase().includes(q) ||
          u.userId.includes(q)
      )
      .slice(0, 20)
      .map((u) => ({
        userId: u.userId,
        name: u.name,
        surname: u.surname,
        role: u.role,
      }));
  },
});

export const getMembers = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);
    return await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});
