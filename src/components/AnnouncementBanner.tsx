"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const containerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;
    const textLength = announcements.reduce((sum, a) => sum + a.text.length, 0);
    setDuration(Math.max(15, textLength * 0.12));
  }, [announcements]);

  if (!announcements || announcements.length === 0) return null;

  const items = [...announcements, ...announcements, ...announcements];

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden border-b border-zinc-800 relative"
      style={{ backgroundColor: announcements[0]?.bgColor || "#18181b" }}
    >
      <div className="w-full flex items-center h-9 relative">
        <div className="flex items-center gap-1.5 px-3 h-full shrink-0 z-10" style={{ backgroundColor: announcements[0]?.bgColor || "#18181b" }}>
          <Megaphone size={14} className="shrink-0" style={{ color: announcements[0]?.textColor || "#fff" }} />
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-16 whitespace-nowrap"
            style={{
              animation: `scrollBanner ${duration}s linear infinite`,
            }}
          >
            {items.map((a, i) => (
              <span
                key={`${a._id}-${i}`}
                className="text-xs font-medium leading-9"
                style={{ color: announcements[0]?.textColor || "#fff" }}
              >
                {a.text}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scrollBanner {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${100 / 3}%); }
        }
      `}</style>
    </div>
  );
}
