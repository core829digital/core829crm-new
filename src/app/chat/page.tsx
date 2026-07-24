"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "@/components/AuthContext";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import NewConversationModal from "@/components/NewConversationModal";
import { MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialConv = searchParams.get("conversation") as Id<"conversations"> | null;
  const [selectedId, setSelectedId] = useState<Id<"conversations"> | undefined>(
    initialConv || undefined
  );
  const [showNewModal, setShowNewModal] = useState(false);

  const handleSelect = useCallback((id: Id<"conversations">) => {
    setSelectedId(id);
  }, []);

  const handleCreated = useCallback((id: Id<"conversations">) => {
    setSelectedId(id);
    setShowNewModal(false);
  }, []);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-4.5rem)] flex">
      <ChatSidebar
        selectedId={selectedId}
        onSelect={handleSelect}
        onStartNew={() => setShowNewModal(true)}
      />

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

      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
