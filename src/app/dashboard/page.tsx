import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import {
  Cpu,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  ArrowRight,
  Clock,
  Layers,
  Wrench,
  Zap,
  Droplet,
  Grid,
} from "lucide-react";

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
  const activeMap = new Map<string, number>(activeByMachine.map((r: any) => [r.machineId, Number(r._count ?? 0)]));

  const counts = { open: 0, assigned: 0, accepted: 0, in_progress: 0, resolved: 0 };
  for (const t of tickets) counts[t.status as keyof typeof counts]++;
  const openCount = counts.open + counts.assigned + counts.accepted + counts.in_progress;
  const criticalOpen = tickets.filter(
    (t: any) => t.urgency === "critical" && (ACTIVE as readonly string[]).includes(t.status)
  ).length;
  const machinesWithIssues = machines.filter((m: any) => Number(activeMap.get(m.id) ?? 0) > 0).length;

  const byCategory = await prisma.maintenanceTicket.groupBy({ by: ["category"], _count: true });
  const catMap = new Map<string, number>(byCategory.map((r: any) => [r.category, Number(r._count ?? 0)]));
  const maxCat = Math.max(1, ...byCategory.map((r: any) => Number(r._count ?? 0)));

  const kpis = [
    {
      label: "Total Machines",
      value: machines.length,
      sub: `${machinesWithIssues} with open issues`,
      icon: Cpu,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      tone: "text-slate-900",
    },
    {
      label: "Open Tickets",
      value: openCount,
      sub: `${counts.in_progress} currently in progress`,
      icon: Ticket,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      tone: "text-amber-700",
    },
    {
      label: "Critical Alerts",
      value: criticalOpen,
      sub: "Immediate breakdown attention",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600 border-red-200",
      tone: "text-red-700",
    },
    {
      label: "Resolved Total",
      value: counts.resolved,
      sub: "Successfully completed",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      tone: "text-emerald-700",
    },
  ];

  const catIcons: Record<string, any> = {
    electrical: Zap,
    mechanical: Wrench,
    hydraulic: Droplet,
    other: Grid,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Factory Operations Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{facilities.map((f: any) => f.name).join(" · ")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/maintenance/tickets"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs transition-colors"
          >
            <span>Ticket Kanban</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/maintenance/machines/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-xs transition-colors"
          >
            <span>+ Add Machine</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</span>
                <div className={`w-8 h-8 rounded-xl grid place-items-center border ${k.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${k.tone}`}>{k.value}</div>
              <div className="text-[11px] font-medium text-slate-500 truncate">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Analytics and Recent Activity Split */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tickets Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">Recent Maintenance Log</h2>
              </div>
              <Link
                href="/dashboard/maintenance/tickets"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View All Tickets</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center font-medium">No tickets created yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((t: any) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/maintenance/tickets/${t.id}`}
                      className="flex items-center justify-between gap-3 py-3.5 px-2 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded shrink-0">
                          {t.ticketNo}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-900 truncate">{t.machine.name}</span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {t.machine.facility.name} · {t.operatorName || "Operator"} ·{" "}
                            {CATEGORY_LABELS[t.category]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge kind="urgency" value={t.urgency} />
                        <Badge kind="status" value={t.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Categories and Tech Load */}
        <div className="space-y-6">
          {/* Category breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Tickets by Category</h2>
            </div>
            <div className="space-y-3">
              {(["electrical", "mechanical", "hydraulic", "other"] as const).map((c) => {
                const n = catMap.get(c) ?? 0;
                const Icon = catIcons[c] || Grid;
                return (
                  <div key={c} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {CATEGORY_LABELS[c]}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.round((n / maxCat) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician workload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Technician Workload</h2>
            </div>
            {technicians.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No active technicians registered.</p>
            ) : (
              <ul className="space-y-2.5">
                {technicians.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{t.name}</span>
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-bold text-slate-700">
                      {t._count.assignedTickets} active
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Machine Status Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Machine Inventory Health</h2>
          </div>
          <Link
            href="/dashboard/maintenance/machines"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Manage All Machines</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 pr-4">Code</th>
                <th className="py-2.5 pr-4">Machine Name</th>
                <th className="py-2.5 pr-4">Plant Facility</th>
                <th className="py-2.5 pr-4">Bay Location</th>
                <th className="py-2.5">Maintenance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machines.map((m: any) => {
                const openCountForMachine = Number(activeMap.get(m.id) ?? 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-black text-blue-700">{m.code}</td>
                    <td className="py-3 pr-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{m.facility.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{m.locationName || "—"}</td>
                    <td className="py-3">
                      {openCountForMachine > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{openCountForMachine} Open Issue{openCountForMachine > 1 ? "s" : ""}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
