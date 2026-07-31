import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/pin";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const pin = String((body as { pin?: unknown })?.pin ?? "").trim();
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 4-digit PIN to view tickets." }, { status: 400 });
  }

  const pinHash = hashPin(pin);
  const operator = await prisma.machineOperator.findFirst({
    where: { pinHash, active: true },
  });
  if (!operator) {
    return NextResponse.json({ error: "No worker found for this PIN." }, { status: 401 });
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { operatorPinHash: pinHash },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      ticketNo: true,
      urgency: true,
      category: true,
      description: true,
      photoPath: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      machine: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json({
    operator: { id: operator.id, name: operator.name },
    tickets,
  });
}
