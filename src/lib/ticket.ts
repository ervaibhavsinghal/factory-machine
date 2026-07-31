import { prisma } from "@/lib/prisma";

export async function genTicketNo(): Promise<string> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const count = await prisma.maintenanceTicket.count({
    where: { createdAt: { gte: start } },
  });
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `TK-${y}${m}${d}-${String(count + 1).padStart(4, "0")}`;
}
