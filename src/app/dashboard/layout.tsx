import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import Sidebar from "@/components/dashboard/Sidebar";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "guard") redirect("/login"); // Module 2 (Gate) is a future module

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-slate-900 text-white flex items-center gap-3 px-4 h-[57px]">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-sm">
            ⚙
          </span>
          <span>Machinify</span>
        </Link>
        <div className="flex-1" />
        <span className="text-xs text-slate-400 hidden sm:block">{ROLE_LABELS[session.role]}</span>
        <span className="text-sm font-semibold text-slate-200 hidden sm:block">{session.name}</span>
        <LogoutButton />
      </header>
      <div className="flex">
        <Sidebar role={session.role} />
        <main className="flex-1 min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
