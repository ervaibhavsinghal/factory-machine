import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const openCount = await prisma.maintenanceTicket.count({
    where: { status: { in: ["open", "assigned", "accepted", "in_progress"] } },
  });
  const machineCount = await prisma.machine.count();
  const workerCount = await prisma.machineOperator.count({ where: { active: true } });
  const recent = await prisma.maintenanceTicket.findMany({
    include: { machine: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const isManager = session.role === "manager" || session.role === "owner";

  const cards = [
    {
      href: "/dashboard/maintenance/machines",
      icon: "🏭",
      title: "Machines",
      desc: "Register machines, upload manuals, print QR stickers.",
      stat: `${machineCount} machines`,
      show: isManager,
    },
    {
      href: "/dashboard/maintenance/tickets",
      icon: "🎫",
      title: session.role === "technician" ? "My Tickets" : "Ticket Board",
      desc: "Open, in-progress and resolved issues.",
      stat: `${openCount} open`,
      show: true,
    },
    {
      href: "/dashboard/maintenance/workers",
      icon: "🪪",
      title: "Workers & PINs",
      desc: "Assign 4-digit PINs to machine operators.",
      stat: `${workerCount} workers`,
      show: session.role === "manager",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Maintenance Module</h1>
      <p className="text-sm text-slate-500 mb-6">QR-powered machine issue management</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {cards
          .filter((c) => c.show)
          .map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl">{c.icon}</div>
              <div className="font-bold mt-3 flex items-center justify-between">
                {c.title}
                <span className="text-xs font-semibold text-slate-400">{c.stat}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
            </Link>
          ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-3xl">
        <h2 className="font-bold mb-3">Latest tickets</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No tickets yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/maintenance/tickets/${t.id}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                >
                  <span className="font-mono text-xs font-bold text-blue-700 w-32 shrink-0">{t.ticketNo}</span>
                  <span className="flex-1 text-sm font-medium truncate">{t.machine.name}</span>
                  <Badge kind="urgency" value={t.urgency} />
                  <Badge kind="status" value={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
