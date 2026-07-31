import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import AssignButton from "@/components/maintenance/AssignButton";
import TechActions from "@/components/maintenance/TechActions";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      machine: { include: { facility: true, documents: true } },
      assignedTo: true,
      approvedBy: true,
    },
  });
  if (!ticket) notFound();
  if (session.role === "technician" && ticket.assignedToId !== session.id) redirect("/dashboard/maintenance/tickets");

  const isTech = session.role === "technician";
  const isManager = session.role === "manager" || session.role === "owner";

  const technicians = isManager
    ? await prisma.user.findMany({ where: { role: "technician", active: true }, orderBy: { name: "asc" } })
    : [];

  const timeline = [
    { label: "Raised", time: ticket.createdAt, done: true },
    { label: "Accepted", time: ticket.acceptedAt },
    { label: "Started", time: ticket.startedAt },
    { label: "Resolved", time: ticket.resolvedAt },
  ];

  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/maintenance/tickets" className="text-sm font-semibold text-blue-600 hover:underline">
        ← Back to ticket board
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{ticket.ticketNo}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge kind="status" value={ticket.status} />
            <Badge kind="urgency" value={ticket.urgency} />
            <Badge kind="category" value={ticket.category} />
          </div>
        </div>
        <div>
          {isTech ? (
            <TechActions ticketId={ticket.id} status={ticket.status} />
          ) : (
            ["open", "assigned"].includes(ticket.status) && (
              <AssignButton
                ticketId={ticket.id}
                ticketNo={ticket.ticketNo}
                technicians={technicians.map((t: any) => ({ id: t.id, name: t.name }))}
                currentAssignedId={ticket.assignedToId}
              />
            )
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-2">Issue description</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            {ticket.photoPath ? (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.photoPath}
                  alt="Fault photo"
                  className="rounded-xl border border-slate-200 max-h-80 w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-4">Timeline</h2>
            <ol className="relative border-l-2 border-slate-100 pl-6 space-y-5">
              {timeline.map((s) => (
                <li key={s.label} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                      s.time ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  />
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-slate-400">{s.time ? s.time.toLocaleString() : "Pending"}</div>
                </li>
              ))}
            </ol>
          </div>

          {ticket.status === "resolved" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="font-bold text-emerald-800 mb-1">Resolution</h2>
              <p className="text-sm text-emerald-900 whitespace-pre-wrap">{ticket.resolution}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-3">Machine</h2>
            <Link href={`/dashboard/maintenance/machines/${ticket.machine.id}`} className="block hover:underline">
              <div className="font-semibold">{ticket.machine.name}</div>
            </Link>
            <div className="font-mono text-xs font-bold text-blue-700 mt-0.5">{ticket.machine.code}</div>
            <div className="text-sm text-slate-500 mt-2">
              📍 {ticket.machine.locationName || ticket.machine.facility.name}
              <br />
              🏭 {ticket.machine.facility.name}
            </div>
            {ticket.machine.documents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Reference docs</div>
                <ul className="space-y-1.5">
                  {ticket.machine.documents.slice(0, 4).map((d: any) => (
                    <li key={d.id}>
                      <a
                        href={`/api/uploads/docs/${d.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-700 hover:underline"
                      >
                        📄 {d.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-3">Details</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Reported by</dt><dd>{ticket.operatorName || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Reported at</dt><dd>{ticket.createdAt.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Assigned to</dt><dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd></div>
              {ticket.approvedBy && (
                <div className="flex justify-between"><dt className="text-slate-400">Approved by</dt><dd>{ticket.approvedBy.name}</dd></div>
              )}
              {ticket.lat != null && ticket.lng != null && (
                <div className="flex justify-between"><dt className="text-slate-400">Location</dt><dd className="font-mono text-xs">{ticket.lat.toFixed(5)}, {ticket.lng.toFixed(5)}</dd></div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
