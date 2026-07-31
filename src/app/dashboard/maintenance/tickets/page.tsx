import Link from "next/link";
import { redirect } from "next/navigation";
import type { Category, Urgency } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import AssignButton, { type TechnicianOption } from "@/components/maintenance/AssignButton";
import TechActions from "@/components/maintenance/TechActions";

export const dynamic = "force-dynamic";

type Card = {
  id: string;
  ticketNo: string;
  status: string;
  urgency: Urgency;
  category: Category;
  operatorName: string;
  createdAt: Date;
  assignedToId: string | null;
  machine: { name: string };
  assignedTo: { name: string } | null;
};

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

export default async function TicketsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isTech = session.role === "technician";

  if (isTech) {
    const tickets = await prisma.maintenanceTicket.findMany({
      where: { assignedToId: session.id },
      include: { machine: { include: { facility: true } }, assignedTo: true, approvedBy: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const order = { assigned: 0, accepted: 1, in_progress: 2, resolved: 3, open: 4 } as const;
    tickets.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

    return (
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-sm text-slate-500 mb-6">Tickets assigned to you</p>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
            No tickets assigned to you yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700">{t.ticketNo}</span>
                  <Badge kind="status" value={t.status} />
                </div>
                <Link href={`/dashboard/maintenance/tickets/${t.id}`}>
                  <h3 className="font-bold text-[15px] mt-2 hover:text-blue-700">{t.machine.name}</h3>
                </Link>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.machine.facility.name} · {t.machine.locationName || "—"}
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{t.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge kind="urgency" value={t.urgency} />
                  <Badge kind="category" value={t.category} />
                </div>
                <div className="mt-4">
                  <TechActions ticketId={t.id} status={t.status} />
                </div>
                <div className="text-xs text-slate-400 mt-3">
                  {timeAgo(t.createdAt)} · by {t.operatorName || "Operator"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Manager / Owner: Kanban board
  const [tickets, technicians] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      include: { machine: { include: { facility: true } }, assignedTo: true, approvedBy: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: "technician", active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const techOptions: TechnicianOption[] = technicians.map((t) => ({ id: t.id, name: t.name }));

  const open = tickets.filter((t) => ["open", "assigned", "accepted"].includes(t.status));
  const inProgress = tickets.filter((t) => t.status === "in_progress");
  const resolved = tickets.filter((t) => t.status === "resolved");

  const openOrder = { open: 0, assigned: 1, accepted: 2 } as const;
  open.sort((a, b) => {
    const oa = openOrder[a.status as keyof typeof openOrder] ?? 9;
    const ob = openOrder[b.status as keyof typeof openOrder] ?? 9;
    return oa - ob;
  });

  const col = (title: string, color: string, list: Card[], count: number) => (
    <div className="rounded-2xl bg-slate-100 p-3 min-h-[160px]">
      <h4 className="flex items-center gap-2 px-1 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {title}
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px]">{count}</span>
      </h4>
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold text-blue-700">{t.ticketNo}</span>
              <Badge kind="urgency" value={t.urgency} />
            </div>
            <Link href={`/dashboard/maintenance/tickets/${t.id}`}>
              <div className="font-semibold text-sm mt-1.5 hover:text-blue-700">{t.machine.name}</div>
            </Link>
            <div className="text-[11px] text-slate-400">{CATEGORY_LABELS[t.category]} · {timeAgo(t.createdAt)}</div>
            <div className="text-[11px] text-slate-400">by {t.operatorName || "Operator"}</div>
            <div className="flex items-center justify-between gap-2 mt-2.5">
              {t.assignedTo ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> {t.assignedTo.name}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-600">Unassigned</span>
              )}
              {["open", "assigned"].includes(t.status) && (
                <AssignButton
                  ticketId={t.id}
                  ticketNo={t.ticketNo}
                  technicians={techOptions}
                  currentAssignedId={t.assignedToId}
                />
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-6">Nothing here</div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Ticket Board</h1>
      <p className="text-sm text-slate-500 mb-6">Approve, assign and track maintenance tickets</p>

      <div className="grid lg:grid-cols-3 gap-4">
        {col("Open", "bg-red-400", open, open.length)}
        {col("In Progress", "bg-amber-400", inProgress, inProgress.length)}
        {col("Resolved", "bg-emerald-400", resolved, resolved.length)}
      </div>
    </div>
  );
}
