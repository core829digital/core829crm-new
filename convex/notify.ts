import type { MutationCtx } from "./_generated/server";

export async function notify(
  ctx: MutationCtx,
  fields: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }
) {
  await ctx.db.insert("notifications", {
    userId: fields.userId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    link: fields.link,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}
