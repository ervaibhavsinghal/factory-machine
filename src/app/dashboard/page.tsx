import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ACTIVE = ["open", "assigned", "accepted", "in_progress"] as const;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "technician") redirect("/dashboard/maintenance/tickets");

  const [machines, tickets, recent, technicians, facilities] = await Promise.all([
    prisma.machine.findMany({ include: { facility: true }, orderBy: { code: "asc" } }),
    prisma.maintenanceTicket.findMany({ select: { status: true, urgency: true } }),
    prisma.maintenanceTicket.findMany({
      include: { machine: { include: { facility: true } }, assignedTo: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.user.findMany({
      where: { role: "technician", active: true },
      select: {
        id: true,
        name: true,
        _count: { select: { assignedTickets: { where: { status: { in: ["assigned", "accepted", "in_progress"] } } } } },
      },
    }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  const activeByMachine = await prisma.maintenanceTicket.groupBy({
    by: ["machineId"],
    where: { status: { in: [...ACTIVE] } },
    _count: true,
  });
  const activeMap = new Map(activeByMachine.map((r) => [r.machineId, r._count]));

  const counts = { open: 0, assigned: 0, accepted: 0, in_progress: 0, resolved: 0 };
  for (const t of tickets) counts[t.status as keyof typeof counts]++;
  const openCount = counts.open + counts.assigned + counts.accepted + counts.in_progress;
  const criticalOpen = tickets.filter(
    (t) => t.urgency === "critical" && (ACTIVE as readonly string[]).includes(t.status)
  ).length;
  const machinesWithIssues = machines.filter((m) => (activeMap.get(m.id) ?? 0) > 0).length;

  const byCategory = await prisma.maintenanceTicket.groupBy({ by: ["category"], _count: true });
  const catMap = new Map(byCategory.map((r) => [r.category, r._count]));
  const maxCat = Math.max(1, ...byCategory.map((r) => r._count));

  const kpis = [
    { label: "Machines", value: machines.length, sub: `${machinesWithIssues} with open issues`, tone: "text-slate-900" },
    { label: "Open Tickets", value: openCount, sub: `${counts.in_progress} in progress`, tone: "text-blue-600" },
    { label: "Resolved", value: counts.resolved, sub: "all time", tone: "text-emerald-600" },
    { label: "Critical Open", value: criticalOpen, sub: "machine down / critical", tone: "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Factory Overview</h1>
      <p className="text-sm text-slate-500 mb-6">
        {facilities.map((f) => f.name).join(", ")} · live maintenance status
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k.label}</div>
            <div className={`text-3xl font-extrabold mt-1 ${k.tone}`}>{k.value}</div>
            <div className="text-xs text-slate-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent tickets</h2>
            <Link href="/dashboard/maintenance/tickets" className="text-sm font-semibold text-blue-600 hover:underline">
              Ticket board →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/maintenance/tickets/${t.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                  >
                    <span className="font-mono text-xs font-bold text-blue-700 w-32 shrink-0">{t.ticketNo}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{t.machine.name}</span>
                      <span className="block text-xs text-slate-400">
                        {t.machine.facility.name} · {t.operatorName || "Operator"} ·{" "}
                        {CATEGORY_LABELS[t.category]}
                      </span>
                    </span>
                    <Badge kind="urgency" value={t.urgency} />
                    <Badge kind="status" value={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold mb-4">Tickets by category</h2>
          <div className="space-y-3">
            {Object.values(["electrical", "mechanical", "hydraulic", "other"] as const).map((c) => {
              const n = catMap.get(c) ?? 0;
              return (
                <div key={c} className="grid grid-cols-[92px_1fr_30px] items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">{CATEGORY_LABELS[c]}</span>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.round((n / maxCat) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 text-right">{n}</span>
                </div>
              );
            })}
          </div>

          <h2 className="font-bold mt-6 mb-3">Technician load</h2>
          {technicians.length === 0 ? (
            <p className="text-xs text-slate-400">No technicians registered.</p>
          ) : (
            <ul className="space-y-2">
              {technicians.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {t._count.assignedTickets} active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Machines</h2>
          <Link href="/dashboard/maintenance/machines" className="text-sm font-semibold text-blue-600 hover:underline">
            Manage machines →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-2.5 pr-3 font-semibold">Code</th>
                <th className="py-2.5 pr-3 font-semibold">Machine</th>
                <th className="py-2.5 pr-3 font-semibold">Facility</th>
                <th className="py-2.5 pr-3 font-semibold">Location</th>
                <th className="py-2.5 pr-3 font-semibold">Open issues</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-mono text-xs font-bold text-blue-700">{m.code}</td>
                  <td className="py-2.5 pr-3 font-semibold">{m.name}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{m.facility.name}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{m.locationName || "—"}</td>
                  <td className="py-2.5">
                    {(activeMap.get(m.id) ?? 0) > 0 ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
                        {(activeMap.get(m.id) ?? 0)} open
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
