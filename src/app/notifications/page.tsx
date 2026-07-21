"use client";

export const dynamic = "force-dynamic";

import { useQuery, useMutation } from "convex/react";
import { CheckCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { api } from "../../../convex/_generated/api";

export default function NotificationsPage() {
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.listForUser, {
    userId: user?.userId ?? "",
    limit: 100,
  }) ?? [];
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const unread = notifications.filter((n) => !n.isRead);

  const grouped: Record<string, typeof notifications> = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt).toLocaleDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(n);
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-black">Notifications</h1>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllRead({ userId: user?.userId })}
            className="text-sm text-red-600 hover:text-red-500 flex items-center gap-1.5 font-medium"
          >
            <CheckCheck size={16} />
            Mark all read ({unread.length})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Bell className="mx-auto mb-3" size={40} />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {date === new Date().toLocaleDateString() ? "Today" : date}
              </h2>
              <div className="space-y-1">
                {items.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      n.isRead
                        ? "border-zinc-200 bg-white"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            n.isRead ? "text-zinc-700" : "text-red-700"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead({ id: n._id })}
                        className="shrink-0 p-1.5 text-zinc-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                        title="Mark as read"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    {n.link && (
                      <Link
                        href={n.link}
                        className="shrink-0 text-xs text-red-600 hover:text-red-500 mt-1"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Bell(props: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
