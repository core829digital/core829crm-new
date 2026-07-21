"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "./AuthContext";
import { LayoutDashboard, KanbanSquare, Table2, TrendingUp, CalendarDays, Users, Shield, LogOut } from "lucide-react";

const links = [
  { href: "/", label: "Kanban", icon: KanbanSquare },
  { href: "/leads", label: "Lead Log", icon: Table2 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projection", label: "Projection", icon: TrendingUp },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <nav className="bg-black text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 sm:gap-4 h-14 overflow-x-auto">
          <Link href="/" className="shrink-0 mr-1">
            <Image src="/logo-icon.png" alt="Core829" width={28} height={28} priority />
          </Link>

          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 sm:py-1.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-red-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}

          {user?.userId === "00001" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 sm:py-1.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === "/admin"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <div className="ml-auto flex items-center gap-3 shrink-0 pl-2 border-l border-zinc-700">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-white leading-tight">
                {user?.name} {user?.surname}
              </div>
              <div className="text-[10px] text-zinc-500 leading-tight">
                {user?.userId} &middot; {user?.role}
              </div>
            </div>
            <div className="sm:hidden text-right">
              <div className="text-[10px] text-zinc-400 leading-tight">{user?.userId}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
