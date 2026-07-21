"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

const GAP = 64;

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.listActive);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    const view = containerRef.current;
    if (!el || !view || !announcements || announcements.length === 0) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;

    const SPEED = 0.5;
    let running = true;

    const totalWidth = children.reduce((sum, c) => sum + c.offsetWidth + GAP, 0);
    const viewW = view.offsetWidth;
    let startX = viewW;
    const xs = new Array(children.length);

    for (let i = 0; i < children.length; i++) {
      xs[i] = startX;
      children[i].style.transform = `translateX(${startX}px)`;
      startX += children[i].offsetWidth + GAP;
    }

    const step = () => {
      if (!running) return;

      for (let i = 0; i < children.length; i++) {
        xs[i] -= SPEED;
        children[i].style.transform = `translateX(${xs[i]}px)`;
      }

      if (xs[0] + children[0].offsetWidth + GAP < 0) {
        const last = children.length - 1;
        xs[0] = xs[last] + children[last].offsetWidth + GAP;
        children.push(children.shift()!);
        const firstX = xs.shift()!;
        xs.push(firstX);
      }

      requestAnimationFrame(step);
    };

    const id = requestAnimationFrame(step);
    return () => { running = false; cancelAnimationFrame(id); };
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
        <div ref={containerRef} className="overflow-hidden flex-1 relative">
          <div ref={trackRef} className="absolute inset-0">
            {announcements.map((a) => (
              <span
                key={a._id}
                className="absolute top-0 left-0 text-xs font-medium leading-9 whitespace-nowrap"
                style={{ color: fg }}
              >
                {a.text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
