"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "./AuthContext";
import { api } from "../../convex/_generated/api";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const allNotifications = useQuery(api.notifications.listForUser, {
    userId: user?.userId ?? "",
    limit: 100,
  });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const notifications = allNotifications ?? [];

  const unread = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!user) return null;

  const grouped: Record<string, typeof notifications> = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt).toLocaleDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(n);
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-1.5 text-zinc-400 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell size={15} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-600 rounded-full">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="w-full max-w-md bg-zinc-900 border-l border-zinc-700 shadow-2xl flex flex-col h-full"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700 shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-zinc-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unread.length > 0 && (
                  <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unread.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button
                    onClick={() => markAllRead({ userId: user?.userId })}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {unread.length > 0 && (
                <div className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-300">
                    Hai {unread.length} notifica{unread.length !== 1 ? "e" : ""} non lett{unread.length !== 1 ? "e" : "a"}
                  </span>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="px-5 py-16 text-center text-zinc-500 text-sm">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-4">
                  {Object.entries(grouped).map(([date, items]) => (
                    <div key={date}>
                      <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 px-1">
                        {date === new Date().toLocaleDateString() ? "Oggi" : date}
                      </h3>
                      <div className="space-y-1">
                        {items.map((n) => (
                          <div
                            key={n._id}
                            className={`flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                              n.isRead
                                ? "opacity-60 hover:bg-zinc-800/30"
                                : "bg-zinc-800/40 hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                )}
                                <span className={`text-xs font-medium truncate ${n.isRead ? "text-zinc-400" : "text-white"}`}>
                                  {n.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-600">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                                {n.link && (
                                  <Link
                                    href={n.link}
                                    onClick={() => setOpen(false)}
                                    className="text-[10px] text-red-400 hover:text-red-300"
                                  >
                                    Dettagli &rarr;
答                                </Link>
                                )}
                              </div>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={() => markRead({ id: n._id })}
                                className="shrink-0 p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-zinc-700"
                                title="Mark as read"
                              >
                                <CheckCheck size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-zinc-400 hover:text-white py-3 border-t border-zinc-700 shrink-0 transition-colors"
            >
              Vedi tutte le notifiche
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
