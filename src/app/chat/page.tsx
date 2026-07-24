"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "@/components/AuthContext";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import NewConversationModal from "@/components/NewConversationModal";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialConv = searchParams.get("conversation") as Id<"conversations"> | null;
  const [selectedId, setSelectedId] = useState<Id<"conversations"> | undefined>(
    initialConv || undefined
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!initialConv);

  const handleSelect = useCallback((id: Id<"conversations">) => {
    setSelectedId(id);
    setShowSidebar(false);
  }, []);

  const handleCreated = useCallback((id: Id<"conversations">) => {
    setSelectedId(id);
    setShowNewModal(false);
    setShowSidebar(false);
  }, []);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-4.5rem)] relative flex">
      {/* Mobile sidebar toggle */}
      {selectedId && (
        <button
          onClick={() => setShowSidebar(true)}
          className="sm:hidden absolute top-2 left-2 z-20 bg-white border border-zinc-200 rounded-lg p-1.5 shadow-sm"
        >
          <ChevronLeft size={16} className="text-zinc-600" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`absolute sm:relative inset-y-0 left-0 z-10 w-72 sm:w-80 bg-white transition-transform duration-200 ${
        showSidebar ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      }`}>
        {!showSidebar && (
          <div className="hidden sm:block h-full">
            <ChatSidebar
              selectedId={selectedId}
              onSelect={handleSelect}
              onStartNew={() => setShowNewModal(true)}
            />
          </div>
        )}
        {showSidebar && (
          <ChatSidebar
            selectedId={selectedId}
            onSelect={handleSelect}
            onStartNew={() => setShowNewModal(true)}
          />
        )}
      </div>

      {/* Mobile backdrop */}
      {showSidebar && (
        <div
          className="sm:hidden fixed inset-0 bg-black/30 z-[5]"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <ChatWindow key={selectedId} conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#fafafa]">
            <div className="text-center text-zinc-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Choose a chat from the sidebar or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
