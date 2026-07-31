"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPin } from "@/lib/pin";
import { machineSchema, operatorSchema, resolveSchema } from "@/lib/validators";
import { saveUpload, DOC_DIR } from "@/lib/uploads";

export type ActionResult = { ok: true; id?: string; message?: string } | { error: string };

function firstError(errors: { message: string }[] | undefined, fallback: string): string {
  return errors?.[0]?.message ?? fallback;
}

const MANAGER_ROLES = ["manager", "owner"] as const;
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
];

/* ---------------- Machines ---------------- */

export async function createMachineAction(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can add machines." };
  }
  const parsed = machineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error.issues, "Invalid machine details.") };

  const { name, code, model, facilityId, locationName, lat, lng, geoRadiusM, description } = parsed.data;

  let machineCode = (code || "").toUpperCase();
  if (!machineCode) {
    const slug = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "MC";
    let candidate = "";
    do {
      candidate = `M-${slug}-${randomBytes(2).toString("hex").toUpperCase()}`;
    } while (await prisma.machine.findUnique({ where: { code: candidate } }));
    machineCode = candidate;
  } else if (await prisma.machine.findUnique({ where: { code: machineCode } })) {
    return { error: `Machine code ${machineCode} already exists.` };
  }

  const machine = await prisma.machine.create({
    data: {
      code: machineCode,
      name,
      model: model ?? "",
      facilityId,
      locationName: locationName ?? "",
      lat,
      lng,
      geoRadiusM,
      description: description ?? "",
      createdById: session.id,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/maintenance/machines");
  return { ok: true, id: machine.id, message: `Machine "${machine.name}" registered.` };
}

export async function updateMachineAction(machineId: string, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can edit machines." };
  }
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return { error: "Machine not found." };

  const parsed = machineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error.issues, "Invalid machine details.") };

  const { name, model, facilityId, locationName, lat, lng, geoRadiusM, description } = parsed.data;
  await prisma.machine.update({
    where: { id: machineId },
    data: { name, model: model ?? "", facilityId, locationName: locationName ?? "", lat, lng, geoRadiusM, description: description ?? "" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/maintenance/machines");
  revalidatePath(`/dashboard/maintenance/machines/${machineId}`);
  return { ok: true, message: "Machine updated." };
}

export async function uploadDocumentAction(machineId: string, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can upload documents." };
  }
  const file = formData.get("doc");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return { error: "Unsupported document type. Please upload a PDF or common office document." };
  }
  if (file.size > 25 * 1024 * 1024) return { error: "File is too large (max 25MB)." };

  const saved = await saveUpload(file, DOC_DIR);
  await prisma.machineDocument.create({
    data: {
      machineId,
      filename: saved.filename,
      originalName: file.name,
      mimeType: saved.mimeType,
      size: saved.size,
      uploadedById: session.id,
    },
  });
  revalidatePath(`/dashboard/maintenance/machines/${machineId}`);
  return { ok: true, message: `Uploaded "${file.name}".` };
}

/* ---------------- Workers (operator PINs) ---------------- */

export async function createWorkerAction(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can add workers." };
  }
  const parsed = operatorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error.issues, "Invalid worker details.") };

  const { name, pin, department, facilityId } = parsed.data;
  const pinHash = hashPin(pin);
  const clash = await prisma.machineOperator.findFirst({ where: { pinHash } });
  if (clash) return { error: "That PIN is already assigned to another worker." };

  await prisma.machineOperator.create({
    data: { name, pinHash, department: department ?? "", facilityId: facilityId || null },
  });
  revalidatePath("/dashboard/maintenance/workers");
  return { ok: true, message: `Worker "${name}" added with PIN ${pin}.` };
}

export async function updateWorkerAction(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can manage workers." };
  }
  const id = String(formData.get("id") || "");
  const worker = await prisma.machineOperator.findUnique({ where: { id } });
  if (!worker) return { error: "Worker not found." };

  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const active = formData.get("active") === "on" || formData.get("active") === "true";
  if (name.length < 2) return { error: "Worker name is required." };

  const newPin = String(formData.get("pin") || "").trim();
  const data: Record<string, unknown> = { name, department, active };
  if (newPin) {
    if (!/^\d{4}$/.test(newPin)) return { error: "PIN must be exactly 4 digits." };
    const pinHash = hashPin(newPin);
    const clash = await prisma.machineOperator.findFirst({ where: { pinHash, NOT: { id } } });
    if (clash) return { error: "That PIN is already assigned to another worker." };
    data.pinHash = pinHash;
  }

  await prisma.machineOperator.update({ where: { id }, data });
  revalidatePath("/dashboard/maintenance/workers");
  return { ok: true, message: "Worker updated." };
}

/* ---------------- Tickets ---------------- */

export async function assignTechnicianAction(ticketId: string, technicianId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !MANAGER_ROLES.includes(session.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Only managers can approve and assign tickets." };
  }
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };
  if (!["open", "assigned"].includes(ticket.status)) {
    return { error: "Only open tickets can be approved and assigned." };
  }
  const tech = await prisma.user.findFirst({
    where: { id: technicianId, role: "technician", active: true },
  });
  if (!tech) return { error: "Please select a valid technician." };

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { status: "assigned", assignedToId: tech.id, approvedById: session.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/maintenance/tickets");
  revalidatePath(`/dashboard/maintenance/tickets/${ticketId}`);
  return { ok: true, message: `Assigned to ${tech.name}.` };
}

export async function acceptTicketAction(ticketId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "technician") return { error: "Not authorized." };
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.assignedToId !== session.id) return { error: "This ticket is not assigned to you." };
  if (ticket.status !== "assigned") return { error: "This ticket is not waiting for acceptance." };

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { status: "accepted", acceptedAt: new Date() },
  });
  revalidatePath("/dashboard/maintenance/tickets");
  revalidatePath(`/dashboard/maintenance/tickets/${ticketId}`);
  return { ok: true, message: "Ticket accepted." };
}

export async function startTicketAction(ticketId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "technician") return { error: "Not authorized." };
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.assignedToId !== session.id) return { error: "This ticket is not assigned to you." };
  if (!["assigned", "accepted"].includes(ticket.status)) {
    return { error: "You must accept the ticket before starting the repair." };
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { status: "in_progress", startedAt: new Date() },
  });
  revalidatePath("/dashboard/maintenance/tickets");
  revalidatePath(`/dashboard/maintenance/tickets/${ticketId}`);
  return { ok: true, message: "Repair started." };
}

export async function resolveTicketAction(ticketId: string, resolution: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "technician") return { error: "Not authorized." };
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.assignedToId !== session.id) return { error: "This ticket is not assigned to you." };
  if (ticket.status !== "in_progress") return { error: "Only in-progress tickets can be marked resolved." };

  const parsed = resolveSchema.safeParse({ resolution });
  if (!parsed.success) return { error: firstError(parsed.error.issues, "Please log what was fixed.") };

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { status: "resolved", resolution: parsed.data.resolution, resolvedAt: new Date() },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/maintenance/tickets");
  revalidatePath(`/dashboard/maintenance/tickets/${ticketId}`);
  return { ok: true, message: "Ticket marked resolved." };
}
