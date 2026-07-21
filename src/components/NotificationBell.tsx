"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "./AuthContext";
import { api } from "../../convex/_generated/api";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allNotifications = useQuery(api.notifications.listForUser, {
    userId: user?.userId ?? "",
    limit: 20,
  });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const notifications = allNotifications ?? [];

  const unread = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread.length > 0 && (
              <button
                onClick={() => markAllRead({ userId: user?.userId })}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-2.5 border-b border-zinc-800 last:border-0 transition-colors ${
                    n.isRead ? "opacity-60" : "bg-zinc-800/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {n.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead({ id: n._id })}
                        className="shrink-0 p-1 text-zinc-500 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                  </div>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="text-[10px] text-red-400 hover:text-red-300 mt-1 inline-block"
                    >
                      View details &rarr;
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-zinc-400 hover:text-white py-2.5 border-t border-zinc-700 transition-colors"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
