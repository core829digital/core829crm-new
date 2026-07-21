"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useCallback, useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const trackRef = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    let pos = 0;
    let running = true;

    const step = () => {
      if (!running) return;
      pos -= 0.5;
      const half = el.scrollWidth / 2;
      if (pos <= -half) pos += half;
      el.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return () => { running = false; };
  }, []);

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;
    const cleanup = animate();
    return () => cleanup?.();
  }, [announcements, animate]);

  if (!announcements || announcements.length === 0) return null;

  const items = [...announcements, ...announcements];

  return (
    <div
      className="w-full overflow-hidden border-b border-zinc-800"
      style={{ backgroundColor: announcements[0]?.bgColor || "#18181b" }}
    >
      <div className="w-full flex items-center h-9">
        <div className="flex items-center gap-1.5 px-3 h-full shrink-0 z-10" style={{ backgroundColor: announcements[0]?.bgColor || "#18181b" }}>
          <Megaphone size={14} className="shrink-0" style={{ color: announcements[0]?.textColor || "#fff" }} />
        </div>
        <div className="overflow-hidden flex-1">
          <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
            {items.map((a, i) => (
              <span
                key={`${a._id}-${i}`}
                className="text-xs font-medium leading-9 mr-16"
                style={{ color: announcements[0]?.textColor || "#fff" }}
              >
                {a.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
