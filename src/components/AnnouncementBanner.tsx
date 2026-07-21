"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !announcements?.length) return;
    const parent = track.parentElement;
    const sep = "  •  ";
    const line = announcements.map((a) => a.text).join(sep);
    let pos = parent?.offsetWidth ?? 0;
    let running = true;

    const append = () => { track.appendChild(document.createTextNode(sep + line)); };

    for (let i = 0; i < 20; i++) append();

    const tick = () => {
      if (!running) return;
      pos -= 1.5;
      if (pos < 0 && Math.abs(pos) > track.scrollWidth * 0.5) append();
      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [announcements]);

  if (!announcements?.length) return null;

  const bg = announcements[0].bgColor || "#18181b";
  const fg = announcements[0].textColor || "#fff";

  return (
    <div className="w-full overflow-hidden border-b border-zinc-800 h-9" style={{ backgroundColor: bg }}>
      <div className="flex items-center h-full">
        <div className="flex items-center gap-1.5 px-3 h-full shrink-0" style={{ backgroundColor: bg }}>
          <Megaphone size={14} className="shrink-0" style={{ color: fg }} />
        </div>
        <div className="overflow-hidden flex-1 h-full">
          <div ref={trackRef} className="text-xs font-medium leading-9 whitespace-nowrap" style={{ color: fg }} />
        </div>
      </div>
    </div>
  );
}
