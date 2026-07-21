"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

const GAP = 64;

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !announcements || announcements.length === 0) return;
    const container = el.parentElement;
    let pos = container?.offsetWidth || 0;
    let running = true;

    const step = () => {
      if (!running) return;
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) { running = false; return; }

      const childWidth = child.offsetWidth;
      pos -= 0.5;

      if (pos + childWidth + GAP < 0) {
        pos += childWidth + GAP;
        el.appendChild(child);
      }

      el.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return () => { running = false; };
  }, [announcements]);

  if (!announcements || announcements.length === 0) return null;

  const bg = announcements[0]?.bgColor || "#18181b";
  const fg = announcements[0]?.textColor || "#fff";

  return (
    <div className="w-full overflow-hidden border-b border-zinc-800" style={{ backgroundColor: bg }}>
      <div className="w-full flex items-center h-9">
        <div className="flex items-center gap-1.5 px-3 h-full shrink-0 z-10" style={{ backgroundColor: bg }}>
          <Megaphone size={14} className="shrink-0" style={{ color: fg }} />
        </div>
        <div className="overflow-hidden flex-1">
          <div ref={trackRef} className="flex whitespace-nowrap">
            {announcements.map((a) => (
              <span
                key={a._id}
                className="text-xs font-medium leading-9 shrink-0"
                style={{ color: fg, marginRight: `${GAP}px` }}
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
