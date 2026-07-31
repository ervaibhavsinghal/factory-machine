import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { MACHINE_STATUS_BADGE, MACHINE_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager" && session.role !== "owner") redirect("/dashboard/maintenance/tickets");

  const [machines, activeByMachine] = await Promise.all([
    prisma.machine.findMany({
      include: { facility: true, _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenanceTicket.groupBy({
      by: ["machineId"],
      where: { status: { in: ["open", "assigned", "accepted", "in_progress"] } },
      _count: true,
    }),
  ]);
  const activeMap = new Map(activeByMachine.map((r) => [r.machineId, r._count]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Machines</h1>
          <p className="text-sm text-slate-500">Register machines, upload manuals and manage QR stickers</p>
        </div>
        <Link
          href="/dashboard/maintenance/machines/new"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add machine
        </Link>
      </div>

      {machines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          No machines yet. Add your first machine to generate its QR sticker.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map((m) => {
            const open = activeMap.get(m.id) ?? 0;
            return (
              <Link
                key={m.id}
                href={`/dashboard/maintenance/machines/${m.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[15px] truncate">{m.name}</div>
                    <div className="font-mono text-xs font-bold text-blue-700 mt-0.5">{m.code}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                      MACHINE_STATUS_BADGE[m.status]
                    }`}
                  >
                    {MACHINE_STATUS_LABELS[m.status]}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-500 space-y-0.5">
                  <div>📍 {m.locationName || m.facility.name}</div>
                  {m.model && <div>🔧 {m.model}</div>}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {open > 0 ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-amber-100 text-amber-700">
                      {open} open {open === 1 ? "issue" : "issues"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-emerald-100 text-emerald-700">
                      Healthy
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-slate-100 text-slate-500">
                    {m._count.documents} docs
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
