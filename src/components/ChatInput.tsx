"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Send, Paperclip, Loader2, X } from "lucide-react";

export default function ChatInput({
  conversationId,
  userId,
  userName,
}: {
  conversationId: Id<"conversations">;
  userId: string;
  userName: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useMutation(api.messages.send);
  const generateUrl = useMutation(api.messages.generateAttachmentUploadUrl);
  const setTyping = useMutation(api.messages.setTyping);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleTyping = () => {
    setTyping({ conversationId, userId, userName, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping({ conversationId, userId, userName, isTyping: false });
    }, 4000);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !file) || sending) return;

    setSending(true);
    try {
      let storageId: Id<"_storage"> | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;

      if (file) {
        setUploading(true);
        const uploadUrl = await generateUrl();
        const resp = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        storageId = await resp.json();
        fileName = file.name;
        fileType = file.type;
        setUploading(false);
      }

      await sendMessage({
        userId,
        userName,
        conversationId,
        content: trimmed,
        attachmentStorageId: storageId,
        attachmentName: fileName,
        attachmentType: fileType,
      });

      setText("");
      setFile(null);
      setTyping({ conversationId, userId, userName, isTyping: false });
    } catch {
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-zinc-200 p-3 bg-white">
      {file && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-zinc-50 rounded-md text-xs">
          <Paperclip size={12} className="text-zinc-400" />
          <span className="text-zinc-600 truncate flex-1">{file.name}</span>
          <span className="text-zinc-400">{(file.size / 1024).toFixed(0)} KB</span>
          <button
            onClick={() => setFile(null)}
            className="text-zinc-400 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
          disabled={uploading}
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-black/20 max-h-[120px]"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending || uploading}
          className="p-2 bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
        >
          {sending || uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
