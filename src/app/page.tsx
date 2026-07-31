import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const cards = [
    {
      href: "/operator",
      icon: "📱",
      title: "Machine Operator",
      desc: "No login needed. Scan the QR sticker to raise an issue or check ticket status.",
      cta: "Open Operator App",
    },
    {
      href: "/login?role=manager",
      icon: "🛠️",
      title: "Manager",
      desc: "Register machines, print QR stickers, upload manuals, run the ticket board and manage worker PINs.",
      cta: "Manager Login",
    },
    {
      href: "/login?role=technician",
      icon: "🔧",
      title: "Technician",
      desc: "View assigned tickets with photos & location, accept, start repair and log resolutions.",
      cta: "Technician Login",
    },
    {
      href: "/login?role=owner",
      icon: "📊",
      title: "Owner",
      desc: "Complete factory visibility: machine health, open issues, technician workload and live stats.",
      cta: "Owner Login",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white flex items-center gap-3 px-5 py-4">
        <span className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-lg">
          ⚙
        </span>
        <span className="font-bold text-lg">Machinify</span>
        <span className="flex-1" />
        <span className="text-xs text-slate-400">Factory Machine Management</span>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold leading-tight">QR-Powered Machine Issue Management</h1>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            Operators scan a machine sticker, verify their location with a 4-digit PIN and raise a
            ticket in under a minute. Managers approve &amp; assign, technicians fix, owners stay informed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl">{c.icon}</div>
              <h3 className="font-bold text-lg mt-3">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{c.desc}</p>
              <span className="inline-block mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                {c.cta}
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 mt-8 shadow-sm">
          <h3 className="font-bold mb-3">Demo accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3 font-semibold">Role</th>
                  <th className="py-2 pr-3 font-semibold">Username</th>
                  <th className="py-2 pr-3 font-semibold">Password</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50"><td className="py-2 pr-3">Owner</td><td className="font-mono">owner</td><td className="font-mono">owner123</td></tr>
                <tr className="border-b border-slate-50"><td className="py-2 pr-3">Manager</td><td className="font-mono">manager</td><td className="font-mono">manager123</td></tr>
                <tr className="border-b border-slate-50"><td className="py-2 pr-3">Technician (Vikram)</td><td className="font-mono">tech1</td><td className="font-mono">tech123</td></tr>
                <tr><td className="py-2 pr-3">Technician (Priya)</td><td className="font-mono">tech2</td><td className="font-mono">tech123</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Worker PINs (operators): <b>1234</b> Ramesh · <b>5678</b> Suresh · <b>9012</b> Anita
          </p>
        </div>
      </main>
    </div>
  );
}
