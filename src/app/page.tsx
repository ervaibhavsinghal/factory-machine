import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  Factory,
  Smartphone,
  Wrench,
  Users,
  BarChart3,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const cards = [
    {
      href: "/operator",
      icon: Smartphone,
      title: "Machine Operator",
      badge: "No Login Needed",
      desc: "Scan machine QR sticker with phone camera, verify location via 4-digit PIN, and report issue instantly.",
      cta: "Open Operator App",
      accent: "bg-blue-50 text-blue-700 border-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      href: "/login?role=manager",
      icon: Wrench,
      title: "Plant Manager",
      badge: "Manager Access",
      desc: "Register machines, print QR stickers, manage manuals, run maintenance ticket board and worker PINs.",
      cta: "Manager Sign In",
      accent: "bg-slate-50 text-slate-700 border-slate-200",
      btn: "bg-slate-900 hover:bg-slate-800 text-white",
    },
    {
      href: "/login?role=technician",
      icon: Zap,
      title: "Maintenance Technician",
      badge: "Technician Access",
      desc: "View assigned tickets with machine location, accept issues, perform repairs, and log resolutions.",
      cta: "Technician Sign In",
      accent: "bg-amber-50 text-amber-800 border-amber-200",
      btn: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    {
      href: "/login?role=owner",
      icon: BarChart3,
      title: "Factory Owner",
      badge: "Executive Dashboard",
      desc: "Real-time visibility into factory machine health, breakdown counts, technician load, and resolution logs.",
      cta: "Owner Sign In",
      accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
      btn: "bg-emerald-700 hover:bg-emerald-800 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 grid place-items-center text-white shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">Machinify</span>
              <span className="text-[10px] text-slate-400 font-semibold leading-none">Factory Machine Maintenance</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/operator"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Operator Mode</span>
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>QR Sticker Breakdown Reporting</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Instant Machine Issue Tracking for Factory Operations
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            Operators scan machine QR stickers with any smartphone, verify plant location using a 4-digit PIN, and report breakdowns in seconds. Managers assign, technicians fix, and owners track live stats.
          </p>
        </div>

        {/* Portal Role Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 grid place-items-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${c.accent}`}>
                      {c.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                      {c.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${c.btn}`}>
                    <span>{c.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Demo Credentials Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Demo Accounts &amp; Quick Access</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Password</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-slate-800">Owner</td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-blue-700">owner</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500">owner123</td>
                  <td className="py-2.5 text-right">
                    <Link href="/login?role=owner" className="text-xs font-bold text-blue-600 hover:underline">
                      Login as Owner →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-slate-800">Manager</td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-blue-700">manager</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500">manager123</td>
                  <td className="py-2.5 text-right">
                    <Link href="/login?role=manager" className="text-xs font-bold text-blue-600 hover:underline">
                      Login as Manager →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-slate-800">Technician (Vikram)</td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-blue-700">tech1</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500">tech123</td>
                  <td className="py-2.5 text-right">
                    <Link href="/login?role=technician" className="text-xs font-bold text-blue-600 hover:underline">
                      Login as Tech →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-slate-800">Technician (Priya)</td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-blue-700">tech2</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500">tech123</td>
                  <td className="py-2.5 text-right">
                    <Link href="/login?role=technician" className="text-xs font-bold text-blue-600 hover:underline">
                      Login as Tech →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800">Worker PINs for Operator App: </span>
              <span className="font-mono font-bold text-blue-700">1234</span> (Ramesh) ·{" "}
              <span className="font-mono font-bold text-blue-700">5678</span> (Suresh) ·{" "}
              <span className="font-mono font-bold text-blue-700">9012</span> (Anita)
            </div>
            <Link href="/operator" className="font-bold text-blue-600 hover:underline">
              Launch Operator Mode →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
