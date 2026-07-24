"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "./AuthContext";
import { X, Search, Loader2, Users, MessageSquare } from "lucide-react";

export default function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: Id<"conversations">) => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const searchResults = useQuery(api.conversations.searchUsers, {
    query: search,
  });
  const allUsers = useQuery(api.users.listUsers);
  const createDirect = useMutation(api.conversations.createDirect);
  const createGroup = useMutation(api.conversations.createGroup);

  if (!user) return null;

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      if (tab === "direct" && selectedUsers.length === 1) {
        const otherUser = allUsers?.find((u) => u.userId === selectedUsers[0]);
        if (!otherUser) return;
        const id = await createDirect({
          userId: user.userId,
          userName: `${user.name} ${user.surname}`,
          otherUserId: otherUser.userId,
          otherUserName: `${otherUser.name} ${otherUser.surname}`,
        });
        onCreated(id);
      } else if (tab === "group" && groupName.trim() && selectedUsers.length > 0) {
        const id = await createGroup({
          userId: user.userId,
          userName: `${user.name} ${user.surname}`,
          name: groupName.trim(),
          memberIds: selectedUsers,
        });
        onCreated(id);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const canCreate =
    tab === "direct"
      ? selectedUsers.length === 1
      : groupName.trim().length > 0 && selectedUsers.length > 0;

  const displayUsers = search.trim().length >= 2 ? searchResults : (allUsers || []).filter((u) => u.userId !== user.userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">New Conversation</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
              tab === "direct"
                ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <MessageSquare size={14} className="inline mr-1" />
            Direct
          </button>
          <button
            onClick={() => setTab("group")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
              tab === "group"
                ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Users size={14} className="inline mr-1" />
            Group
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
          {tab === "group" && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-black/20"
            />
          )}

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            {!displayUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 size={14} className="animate-spin text-zinc-400" />
              </div>
            ) : displayUsers.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No users found</p>
            ) : (
              displayUsers.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => toggleUser(u.userId)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    selectedUsers.includes(u.userId)
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-zinc-500">
                      {u.name.charAt(0)}{u.surname.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{u.name} {u.surname}</div>
                    <div className="text-[10px] text-zinc-400">{u.role} &middot; {u.userId}</div>
                  </div>
                  {selectedUsers.includes(u.userId) && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                      <X size={10} className="text-white dark:text-black" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : tab === "direct" ? (
              "Start Direct Message"
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
