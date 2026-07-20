"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KanbanSquare, Table2, TrendingUp } from "lucide-react";

const links = [
  { href: "/", label: "Kanban", icon: KanbanSquare },
  { href: "/leads", label: "Lead Log", icon: Table2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projection", label: "Projection", icon: TrendingUp },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-black text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 sm:gap-6 h-14 overflow-x-auto">
          <Link
            href="/"
            className="font-bold text-lg whitespace-nowrap mr-2 text-white"
          >
            Core<span className="text-red-500">829</span>
          </Link>
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-red-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
