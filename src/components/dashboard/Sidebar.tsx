"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role }: { role: string }) {
  const path = usePathname();
  const isTech = role === "technician";

  const items: { href: string; label: string; icon: string; show: boolean }[] = [
    { href: "/dashboard", label: "Overview", icon: "📊", show: !isTech },
    { href: "/dashboard/maintenance/machines", label: "Machines", icon: "🏭", show: !isTech },
    { href: "/dashboard/maintenance/tickets", label: isTech ? "My Tickets" : "Tickets", icon: "🎫", show: true },
    { href: "/dashboard/maintenance/workers", label: "Workers & PINs", icon: "🪪", show: role === "manager" },
  ];

  const visible = items.filter((i) => i.show);

  return (
    <nav className="w-56 shrink-0 border-r border-slate-200 bg-white hidden md:block p-3 min-h-[calc(100vh-57px)]">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-3 pt-2 pb-2">
        Maintenance
      </div>
      {visible.map((item) => {
        const active =
          item.href === "/dashboard"
            ? path === "/dashboard"
            : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 text-sm font-semibold transition-colors ${
              active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-6 pt-4 border-t border-slate-100 px-3">
        <a
          href="/operator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          <span>📱</span> Operator App ↗
        </a>
      </div>
    </nav>
  );
}
