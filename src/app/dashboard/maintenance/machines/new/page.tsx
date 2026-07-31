import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MachineForm from "@/components/maintenance/MachineForm";

export const dynamic = "force-dynamic";

export default async function NewMachinePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager" && session.role !== "owner") redirect("/dashboard/maintenance/tickets");

  const facilities = await prisma.facility.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/maintenance/machines" className="text-sm font-semibold text-blue-600 hover:underline">
        ← Back to machines
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Register a machine</h1>
      <p className="text-sm text-slate-500 mb-6">
        This will create the machine and let you print its QR sticker for operators to scan.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MachineForm facilities={facilities.map((f) => ({ id: f.id, name: f.name }))} />
      </div>
    </div>
  );
}
