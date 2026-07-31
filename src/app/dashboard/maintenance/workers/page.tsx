import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkersApp from "@/components/maintenance/WorkersApp";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager") redirect("/dashboard");

  const [workers, facilities] = await Promise.all([
    prisma.machineOperator.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <WorkersApp
      workers={workers.map((w: any) => ({
        id: w.id,
        name: w.name,
        department: w.department,
        active: w.active,
        facilityId: w.facilityId,
        createdAt: w.createdAt,
      }))}
      facilities={facilities.map((f: any) => ({ id: f.id, name: f.name }))}
    />
  );
}
