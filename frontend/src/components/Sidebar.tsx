"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  UserCog,
  Calendar,
  FileText,
  Settings,
  Calculator,
  Bell,
  Rocket,
  CalendarDays,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/customers", label: "Kunden", icon: Users },
  { href: "/employees", label: "Mitarbeiter", icon: UserCog },
  { href: "/onboarding", label: "Onboarding", icon: Rocket },
  { href: "/planning/week", label: "Planung", icon: Calendar },
  { href: "/documents", label: "Dokumente", icon: FileText },
  { href: "/calculator", label: "Kalkulator", icon: Calculator },
  { href: "/reminders/invoices", label: "Erinnerungen", icon: Bell },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/20 backdrop-blur-sm md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-blue-500">
          <span className="text-lg font-bold text-white">H</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">
          HygiaAI
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <Link
          href="/planning/week"
          className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-teal-500/20 to-blue-500/20 px-3 py-3 text-sm font-medium text-white transition-all hover:from-teal-500/30 hover:to-blue-500/30"
        >
          <CalendarDays className="h-5 w-5 text-teal-400" />
          <div>
            <p className="font-medium">Schnellplaner</p>
            <p className="text-xs text-gray-400">Wochenansicht öffnen</p>
          </div>
        </Link>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-gray-500">Version 0.1.0</p>
        </div>
      </div>
    </aside>
  );
}

