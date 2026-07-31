import Link from "next/link";
import { redirect } from "next/navigation";
import type { Category, Urgency } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import AssignButton, { type TechnicianOption } from "@/components/maintenance/AssignButton";
import TechActions from "@/components/maintenance/TechActions";
import { Ticket as TicketIcon, Clock, User, Wrench, ChevronRight } from "lucide-react";

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

    const order: Record<string, number> = { assigned: 0, accepted: 1, in_progress: 2, resolved: 3, open: 4 };
    tickets.sort((a: any, b: any) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-blue-600" />
            <span>My Assigned Tickets</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Accept, start work and log resolutions for assigned machine breakdowns.</p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 font-medium text-xs">
            No tickets assigned to you at the moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tickets.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    {t.ticketNo}
                  </span>
                  <Badge kind="status" value={t.status} />
                </div>
                <div>
                  <Link href={`/dashboard/maintenance/tickets/${t.id}`}>
                    <h3 className="font-extrabold text-sm text-slate-900 hover:text-blue-600 transition-colors">
                      {t.machine.name}
                    </h3>
                  </Link>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t.machine.facility.name} · {t.machine.locationName || "Bay"}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3">
                  {t.description}
                </p>

                <div className="flex items-center gap-2">
                  <Badge kind="urgency" value={t.urgency} />
                  <Badge kind="category" value={t.category} />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <TechActions ticketId={t.id} status={t.status} />
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{timeAgo(t.createdAt)}</span>
                  </span>
                  <span>Operator: {t.operatorName || "Worker"}</span>
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

  const techOptions: TechnicianOption[] = technicians.map((t: any) => ({ id: t.id, name: t.name }));

  const open = tickets.filter((t: any) => ["open", "assigned", "accepted"].includes(t.status)) as unknown as Card[];
  const inProgress = tickets.filter((t: any) => t.status === "in_progress") as unknown as Card[];
  const resolved = tickets.filter((t: any) => t.status === "resolved") as unknown as Card[];

  const openOrder: Record<string, number> = { open: 0, assigned: 1, accepted: 2 };
  open.sort((a: any, b: any) => {
    const oa = openOrder[a.status] ?? 9;
    const ob = openOrder[b.status] ?? 9;
    return oa - ob;
  });

  const renderColumn = (title: string, colorDot: string, list: Card[], count: number) => (
    <div className="rounded-2xl bg-slate-100/80 border border-slate-200/80 p-3 flex flex-col space-y-3 min-h-[500px]">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${colorDot}`} />
          <span>{title}</span>
        </div>
        <span className="rounded-full bg-white border border-slate-200 text-slate-800 text-[11px] font-black px-2 py-0.5">
          {count}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {list.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {t.ticketNo}
              </span>
              <Badge kind="urgency" value={t.urgency} />
            </div>

            <Link href={`/dashboard/maintenance/tickets/${t.id}`}>
              <div className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors flex items-center justify-between group">
                <span>{t.machine.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
            </Link>

            <div className="text-[11px] text-slate-500">
              {CATEGORY_LABELS[t.category]} · {timeAgo(t.createdAt)}
            </div>

            <div className="text-[11px] text-slate-400">by {t.operatorName || "Worker"}</div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
              {t.assignedTo ? (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <User className="w-3 h-3 text-indigo-500" />
                  <span>{t.assignedTo.name}</span>
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Unassigned
                </span>
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
          <div className="text-center text-xs text-slate-400 py-12 font-medium">No tickets in this column</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900">Maintenance Ticket Board</h1>
        <p className="text-xs text-slate-500 mt-1">Assign, track, and approve factory breakdown tickets in real time.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {renderColumn("Open & Approved", "bg-red-500", open, open.length)}
        {renderColumn("In Progress", "bg-amber-500", inProgress, inProgress.length)}
        {renderColumn("Resolved", "bg-emerald-500", resolved, resolved.length)}
      </div>
    </div>
  );
}
