"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !announcements || announcements.length === 0) return;

    const text = announcements.map((a) => a.text).join("  •  ");
    el.textContent = text + "  •  " + text;

    let pos = 0;
    let running = true;

    const step = () => {
      if (!running) return;
      pos -= 1.5;
      const half = el.scrollWidth / 2;
      if (pos <= -half) pos = 0;
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
        <div className="flex items-center gap-1.5 px-3 h-full shrink-0" style={{ backgroundColor: bg }}>
          <Megaphone size={14} className="shrink-0" style={{ color: fg }} />
        </div>
        <div className="overflow-hidden flex-1">
          <div ref={scrollRef} className="whitespace-nowrap text-xs font-medium leading-9" style={{ color: fg }} />
        </div>
      </div>
    </div>
  );
}
