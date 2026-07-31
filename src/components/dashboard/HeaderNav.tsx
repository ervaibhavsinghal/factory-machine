"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Ticket,
  Users,
  Smartphone,
  Menu,
  X,
  LogOut,
  User,
  ShieldAlert,
  Wrench,
  Factory,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

interface HeaderNavProps {
  session: {
    id: string;
    name: string;
    role: string;
  };
  roleLabel: string;
}

export default function HeaderNav({ session, roleLabel }: HeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = usePathname();
  const isTech = session.role === "technician";

  const navItems = [
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
      show: session.role === "manager",
    },
  ].filter((i) => i.show);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 md:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
              <Factory className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold leading-none">Machinify</span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">Factory Maintenance</span>
            </div>
          </Link>
        </div>

        {/* Quick Horizontal Nav Links for Desktop */}
        <div className="hidden lg:flex items-center gap-1 mx-6">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Section: Role, User & Operator App button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/operator"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>Operator App ↗</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 grid place-items-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">{session.name}</span>
              <span className="text-[10px] text-blue-400 font-medium leading-none">{roleLabel}</span>
            </div>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center text-white">
                    <Factory className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Machinify</div>
                    <div className="text-[10px] text-slate-400">Navigation Menu</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User badge */}
              <div className="my-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 grid place-items-center font-bold text-xs">
                  {session.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{session.name}</div>
                  <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
                    {roleLabel}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1">
                  Main Navigation
                </div>
                {navItems.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? path === "/dashboard"
                      : path.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1">
                  Machine Operators
                </div>
                <Link
                  href="/operator"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Open Operator App ↗</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
