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

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);

    const pageSize = args.limit || 50;
    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc");

    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("_creationTime"), parseFloat(args.cursor!)));
    }

    const messages = await query.take(pageSize + 1);
    const hasMore = messages.length > pageSize;
    const result = hasMore ? messages.slice(0, pageSize) : messages;
    const nextCursor = hasMore ? String(result[result.length - 1]._creationTime) : undefined;

    return {
      messages: result.reverse(),
      nextCursor,
      hasMore,
    };
  },
});

export const send = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);

    if (!args.content.trim() && !args.attachmentStorageId) {
      throw new Error("Message content or attachment required");
    }
    if (args.content.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.userId,
      senderName: args.userName,
      content: args.content,
      replyTo: args.replyTo,
      reactions: [],
      hasAttachment: !!args.attachmentStorageId,
      attachmentName: args.attachmentName,
      attachmentType: args.attachmentType,
      attachmentStorageId: args.attachmentStorageId,
      createdAt: new Date().toISOString(),
    });

    const preview = args.content.slice(0, 120);
    const conv = await ctx.db.get(args.conversationId);
    if (conv) {
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: preview,
      });
    }

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const m of members) {
      if (m.userId !== args.userId) {
        await notify(ctx, {
          userId: m.userId,
          type: "chat_message",
          title: args.userName,
          message: preview,
          link: `/chat?conversation=${args.conversationId}`,
        });
      }
    }

    return messageId;
  },
});

export const getAttachmentUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);

    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt: new Date().toISOString() });
    } else {
      await ctx.db.insert("readReceipts", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastReadAt: new Date().toISOString(),
      });
    }
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    userName: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.isTyping) {
      const existing = await ctx.db
        .query("typingStatus")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    await assertMember(ctx, args.conversationId, args.userId);

    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    const expiresAt = Date.now() + 5000;
    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: args.userId,
        userName: args.userName,
        expiresAt,
      });
    }
  },
});

export const getTyping = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertMember(ctx, args.conversationId, args.userId);
    const now = Date.now();
    const statuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    return statuses
      .filter((s) => s.userId !== args.userId && s.expiresAt > now)
      .map((s) => ({ userId: s.userId, userName: s.userName }));
  },
});

export const addReaction = mutation({
  args: {
    userId: v.string(),
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    await assertMember(ctx, msg.conversationId, args.userId);

    const reactions = [...msg.reactions];
    const existingIdx = reactions.findIndex((r) => r.emoji === args.emoji);

    if (existingIdx >= 0) {
      const idx = reactions[existingIdx].userIds.indexOf(args.userId);
      if (idx >= 0) {
        reactions[existingIdx].userIds.splice(idx, 1);
        if (reactions[existingIdx].userIds.length === 0) {
          reactions.splice(existingIdx, 1);
        }
      } else {
        reactions[existingIdx].userIds.push(args.userId);
      }
    } else {
      reactions.push({ emoji: args.emoji, userIds: [args.userId] });
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const remove = mutation({
  args: {
    userId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    const member = await assertMember(ctx, msg.conversationId, args.userId);
    const isSender = msg.senderId === args.userId;
    const isAdmin = member.role === "admin";

    if (!isSender && !isAdmin) {
      throw new Error("Only sender or admin can delete messages");
    }

    await ctx.db.patch(args.messageId, {
      content: "",
      reactions: [],
      deletedAt: new Date().toISOString(),
    });

    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: args.userId,
      action: "Deleted message",
      details: `Message ${args.messageId} in conversation ${msg.conversationId}`,
      timestamp: new Date().toISOString(),
    });
  },
});

export const generateAttachmentUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getMessagesByIds = query({
  args: { ids: v.array(v.id("messages")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    const results = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return results.filter(Boolean).map((m) => ({
      _id: m!._id,
      senderName: m!.senderName,
      content: m!.content,
      deletedAt: m!.deletedAt,
    }));
  },
});

export const countUnread = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let total = 0;
    for (const mem of memberships) {
      const receipt = await ctx.db
        .query("readReceipts")
        .withIndex("by_conversation_user", (q) =>
          q.eq("conversationId", mem.conversationId).eq("userId", args.userId)
        )
        .first();
      const since = receipt?.lastReadAt || "1970-01-01T00:00:00.000Z";
      const unread = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", mem.conversationId).gt("createdAt", since)
        )
        .filter((q) => q.neq(q.field("senderId"), args.userId))
        .collect();
      total += unread.length;
    }
    return total;
  },
});
