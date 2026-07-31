import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { MACHINE_STATUS_BADGE, MACHINE_STATUS_LABELS } from "@/lib/constants";
import QRModalButton from "@/components/maintenance/QRModalButton";
import MachineEditCard from "@/components/maintenance/MachineEditCard";
import DocsUpload from "@/components/maintenance/DocsUpload";

export const dynamic = "force-dynamic";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager" && session.role !== "owner") redirect("/dashboard/maintenance/tickets");

  const { id } = await params;
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      facility: true,
      documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      tickets: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!machine) return <p className="text-slate-500">Machine not found.</p>;

  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const qrUrl = `${proto}://${host}/operator?m=${machine.code}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 480, margin: 1, color: { dark: "#0f172a" } });

  const facilities = await prisma.facility.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/maintenance/machines" className="text-sm font-semibold text-blue-600 hover:underline">
        ← Back to machines
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{machine.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-sm font-bold text-blue-700">{machine.code}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${MACHINE_STATUS_BADGE[machine.status]}`}>
              {MACHINE_STATUS_LABELS[machine.status]}
            </span>
            <span className="text-sm text-slate-400">{machine.facility.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <QRModalButton id={machine.id} code={machine.code} dataUrl={qrDataUrl} url={qrUrl} />
          <a
            href={`/api/machines/${machine.id}/qr.png`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ⬇ QR PNG
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Model</dt><dd>{machine.model || "—"}</dd></div>
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Location</dt><dd>{machine.locationName || "—"}</dd></div>
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Latitude</dt><dd className="font-mono">{machine.lat}</dd></div>
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Longitude</dt><dd className="font-mono">{machine.lng}</dd></div>
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Geo-fence radius</dt><dd>{machine.geoRadiusM} m</dd></div>
              <div><dt className="text-slate-400 text-xs font-semibold uppercase">Registered</dt><dd>{machine.createdAt.toLocaleDateString()}</dd></div>
            </dl>
            {machine.description && (
              <p className="mt-4 text-sm text-slate-600 border-t border-slate-100 pt-4">{machine.description}</p>
            )}
            <div className="mt-5">
              <MachineEditCard
                machine={{
                  id: machine.id,
                  code: machine.code,
                  name: machine.name,
                  model: machine.model,
                  facilityId: machine.facilityId,
                  locationName: machine.locationName,
                  lat: machine.lat,
                  lng: machine.lng,
                  geoRadiusM: machine.geoRadiusM,
                  description: machine.description,
                }}
                facilities={facilities.map((f) => ({ id: f.id, name: f.name }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold mb-4">Documents ({machine.documents.length})</h2>
            <DocsUpload machineId={machine.id} />
            {machine.documents.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {machine.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <span className="text-lg">📄</span>
                    <a href={`/api/uploads/docs/${d.filename}`} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-blue-700 hover:underline truncate">{d.originalName}</span>
                      <span className="block text-xs text-slate-400">
                        {(d.size / 1024).toFixed(1)} KB · uploaded by {d.uploadedBy?.name ?? "—"} · {d.createdAt.toLocaleString()}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mt-4 text-center">No documents yet. Upload manuals or troubleshooting guides to help technicians.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="font-bold mb-3">Recent tickets</h2>
          {machine.tickets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No tickets for this machine.</p>
          ) : (
            <ul className="space-y-3">
              {machine.tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/dashboard/maintenance/tickets/${t.id}`} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700">{t.ticketNo}</span>
                      <Badge kind="status" value={t.status} />
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge kind="urgency" value={t.urgency} />
                      <Badge kind="category" value={t.category} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5">
                      {t.createdAt.toLocaleString()} · {t.assignedTo?.name ?? "unassigned"}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
