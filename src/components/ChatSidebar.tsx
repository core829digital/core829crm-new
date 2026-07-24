"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "./AuthContext";
import { MessageSquare, Plus, Search, Users, Loader2 } from "lucide-react";

type ConvSummary = {
  _id: Id<"conversations">;
  name?: string;
  displayName?: string;
  type: "direct" | "group" | "lead";
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
  unreadCount: number;
};

export default function ChatSidebar({
  selectedId,
  onSelect,
  onStartNew,
}: {
  selectedId?: Id<"conversations">;
  onSelect: (id: Id<"conversations">) => void;
  onStartNew: () => void;
}) {
  const { user } = useAuth();
  const conversations = useQuery(api.conversations.listForUser, {
    userId: user?.userId ?? "",
  });
  const [search, setSearch] = useState("");

  if (!user) return null;

  const filtered = (conversations as ConvSummary[] | undefined)?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.lastMessagePreview || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-80 border-r border-zinc-200 flex flex-col bg-white">
      <div className="p-3 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare size={16} />
            Chat
          </h2>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-black/20"
          />
        </div>
      </div>

      <button
        onClick={onStartNew}
        className="mx-3 mt-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-dashed border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
      >
        <Plus size={14} />
        New conversation
      </button>

      <div className="flex-1 overflow-y-auto">
        {!filtered ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <MessageSquare size={24} className="mb-2 opacity-40" />
            <p className="text-xs">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv._id}
              onClick={() => onSelect(conv._id)}
              className={`w-full text-left px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                selectedId === conv._id ? "bg-zinc-100" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                    {conv.type === "group" || conv.type === "lead" ? (
                      <Users size={14} className="text-zinc-500" />
                    ) : (
                      <span className="text-xs font-medium text-zinc-500">
                        {(conv.displayName || "").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">
                      {conv.displayName || "Direct Message"}
                    </div>
                    {conv.lastMessagePreview && (
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {conv.lastMessagePreview}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {conv.lastMessageAt && (
                    <span className="text-[9px] text-zinc-400">
                      {new Date(conv.lastMessageAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-tight">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
