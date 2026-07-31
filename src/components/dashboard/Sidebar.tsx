"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Ticket,
  Users,
  Smartphone,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Sidebar({ role }: { role: string }) {
  const path = usePathname();
  const isTech = role === "technician";

  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: !isTech },
    { href: "/dashboard/maintenance/machines", label: "Machines", icon: Cpu, show: !isTech },
    {
      href: "/dashboard/maintenance/tickets",
      label: isTech ? "My Tickets" : "Ticket Board",
      icon: Ticket,
      show: true,
    },
    {
      href: "/dashboard/maintenance/workers",
      label: "Workers & PINs",
      icon: Users,
      show: role === "manager",
    },
  ];

  const visible = items.filter((i) => i.show);

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-56px)] shadow-xs">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 pt-2 pb-2">
          Workspace
        </div>

        <nav className="space-y-1">
          {visible.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${active ? "opacity-100 text-white/80" : "text-slate-400"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-slate-100">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 pb-2">
            Operators Mode
          </div>
          <Link
            href="/operator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="flex-1">Operator Portal</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">QR</span>
          </Link>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Tip</span>
        </div>
        <p className="leading-snug">
          Operators scan QR codes on machines directly from mobile browsers to log issues.
        </p>
      </div>
    </aside>
  );
}
