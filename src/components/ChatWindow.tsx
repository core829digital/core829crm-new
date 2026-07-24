"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "./AuthContext";
import ChatInput from "./ChatInput";
import { Loader2, ArrowDown, Trash2, Smile, FileText, Image as ImageIcon } from "lucide-react";

const EMOJI_LIST = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}", "\u{1F525}", "\u2705"];

type MessageDoc = {
  _id: Id<"messages">;
  _creationTime: number;
  conversationId: Id<"conversations">;
  senderId: string;
  senderName: string;
  content: string;
  replyTo?: Id<"messages">;
  reactions: { emoji: string; userIds: string[] }[];
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentType?: string;
  attachmentStorageId?: Id<"_storage">;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
};

export default function ChatWindow({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const { user } = useAuth();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const result = useQuery(api.messages.list, {
    conversationId,
    userId: user?.userId ?? "",
    cursor: cursor === "initial" ? undefined : cursor,
    limit: 50,
  });

  const conv = useQuery(api.conversations.getById, {
    conversationId,
    userId: user?.userId ?? "",
  });

  const members = useQuery(api.conversations.getMembers, {
    conversationId,
    userId: user?.userId ?? "",
  });

  const typingUsers = useQuery(api.messages.getTyping, {
    conversationId,
    userId: user?.userId ?? "",
  });

  const markRead = useMutation(api.messages.markRead);
  const addReaction = useMutation(api.messages.addReaction);
  const deleteMessage = useMutation(api.messages.remove);

  useEffect(() => {
    if (!result) return;

    if (cursor === "initial" || !cursor) {
      setMessages(result.messages as MessageDoc[]);
    } else {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const newMsgs = (result.messages as MessageDoc[]).filter((m) => !existingIds.has(m._id));
        return [...newMsgs, ...prev];
      });
    }

    if (!result.hasMore) {
      setCursor(undefined);
    }
  }, [result, cursor]);

  useEffect(() => {
    if (conv) {
      markRead({ conversationId, userId: user?.userId ?? "" });
    }
  }, [conversationId, conv]);

  useEffect(() => {
    if (atBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, atBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAtBottom(isAtBottom);

    if (el.scrollTop < 100 && cursor && !loadingMoreRef.current && result?.hasMore) {
      loadingMoreRef.current = true;
      setCursor(result.nextCursor);
      setTimeout(() => { loadingMoreRef.current = false; }, 500);
    }
  }, [cursor, result]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) return null;
  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  const otherMembers = (members || []).filter((m) => m.userId !== user.userId);
  const displayName = conv.name || otherMembers.map((m) => m.userName).join(", ") || "Chat";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2.5 border-b border-zinc-200 bg-white flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{displayName}</h3>
          <p className="text-[10px] text-zinc-400">
            {conv.type === "group" || conv.type === "lead"
              ? `${(members || []).length} members`
              : otherMembers.map((m) => `${m.userName} (${m.userId})`).join(", ")}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#fafafa]"
      >
        {cursor && result?.hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={14} className="animate-spin text-zinc-400" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send the first message to start the conversation</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user.userId;
          if (msg.deletedAt) {
            return (
              <div key={msg._id} className="flex justify-center py-1">
                <span className="text-[10px] text-zinc-400 italic">
                  Message deleted
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
            >
              <div
                className={`max-w-[75%] relative ${
                  isMe
                    ? "bg-black text-white rounded-2xl rounded-br-md"
                    : "bg-white text-zinc-900 rounded-2xl rounded-bl-md border border-zinc-200"
                } px-3.5 py-2`}
              >
                {!isMe && (
                  <p className="text-[10px] font-medium text-zinc-500 mb-0.5">
                    {msg.senderName}
                  </p>
                )}
                {msg.replyTo && (
                  <div className="text-[10px] opacity-60 mb-1 border-l-2 pl-2 truncate">
                    Replying to a message
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
                {msg.hasAttachment && msg.attachmentName && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] opacity-70">
                    {msg.attachmentType?.startsWith("image/") ? (
                      <ImageIcon size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                    <span className="truncate">{msg.attachmentName}</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[9px] opacity-50">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.reactions.map((r) => (
                      <button
                        key={r.emoji}
                        onClick={() =>
                          addReaction({
                            userId: user.userId,
                            messageId: msg._id,
                            emoji: r.emoji,
                          })
                        }
                        className={`text-xs px-1.5 py-0.5 rounded-full border ${
                          r.userIds.includes(user.userId)
                            ? "bg-zinc-200 border-zinc-300"
                            : "border-transparent hover:border-zinc-300"
                        }`}
                      >
                        {r.emoji} {r.userIds.length}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`absolute -bottom-4 ${isMe ? "left-0" : "right-0"} hidden group-hover:flex items-center gap-0.5`}>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowEmoji(showEmoji === msg._id ? null : msg._id)
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <Smile size={12} />
                    </button>
                    {showEmoji === msg._id && (
                      <div className={`absolute bottom-full mb-1 flex gap-0.5 p-1 bg-white rounded-lg border border-zinc-200 shadow-lg ${isMe ? "right-0" : "left-0"}`}>
                        {EMOJI_LIST.map((e) => (
                          <button
                            key={e}
                            onClick={() => {
                              addReaction({ userId: user.userId, messageId: msg._id, emoji: e });
                              setShowEmoji(null);
                            }}
                            className="hover:bg-zinc-100 rounded p-0.5 text-sm"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {(isMe || user.userId === "00001") && (
                    <button
                      onClick={() => deleteMessage({ userId: user.userId, messageId: msg._id })}
                      className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{typingUsers.map((t) => t.userName).join(", ")} typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 p-2 bg-black text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors z-10"
        >
          <ArrowDown size={14} />
        </button>
      )}

      <ChatInput
        conversationId={conversationId}
        userId={user.userId}
        userName={`${user.name} ${user.surname}`}
      />
    </div>
  );
}
