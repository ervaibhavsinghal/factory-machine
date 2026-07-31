import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/pin";
import { geoStatus } from "@/lib/geo";
import { genTicketNo } from "@/lib/ticket";
import { saveUpload, PHOTO_DIR } from "@/lib/uploads";

const URGENCIES = ["low", "medium", "critical"];
const CATEGORIES = ["electrical", "mechanical", "hydraulic", "other"];

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const machineCode = String(form.get("machineCode") ?? "").trim().toUpperCase();
  const machine = await prisma.machine.findUnique({ where: { code: machineCode } });
  if (!machine) {
    return NextResponse.json(
      { error: "Machine not found. Please scan a valid machine QR code." },
      { status: 404 }
    );
  }

  // ---- Geofence check (authoritative, server side) ----
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const geo = geoStatus(machine, lat, lng);
  if (!geo.inside) {
    if (geo.reason === "location_unavailable") {
      return NextResponse.json(
        {
          error:
            "Your location could not be determined. Please enable location access to raise a ticket.",
          reason: "location_unavailable",
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        error: `You are outside the permitted zone for this machine (${geo.distance}m away, allowed ${geo.radius}m). Tickets can only be raised on-site.`,
        reason: "outside_zone",
        distance: geo.distance,
        radius: geo.radius,
      },
      { status: 403 }
    );
  }

  // ---- Worker PIN verification ----
  const pin = String(form.get("pin") ?? "").trim();
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }
  const operator = await prisma.machineOperator.findFirst({
    where: { pinHash: hashPin(pin), active: true },
  });
  if (!operator) {
    return NextResponse.json(
      { error: "Invalid worker PIN. Please enter your 4-digit PIN." },
      { status: 401 }
    );
  }

  // ---- Fields ----
  const urgency = String(form.get("urgency") ?? "").toLowerCase();
  const category = String(form.get("category") ?? "").toLowerCase();
  const description = String(form.get("description") ?? "").trim();
  if (!URGENCIES.includes(urgency)) {
    return NextResponse.json({ error: "Please select an urgency level." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Please select a category." }, { status: 400 });
  }
  if (description.length < 5) {
    return NextResponse.json(
      { error: "Please describe the issue briefly (minimum 5 characters)." },
      { status: 400 }
    );
  }

  // ---- Optional photo ----
  let photoPath = "";
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo is too large (max 8MB)." }, { status: 400 });
    }
    const saved = await saveUpload(file, PHOTO_DIR);
    photoPath = `/api/uploads/photos/${saved.filename}`;
  }

  const ticketNo = await genTicketNo();
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      ticketNo,
      machineId: machine.id,
      operatorName: operator.name,
      operatorPinHash: hashPin(pin),
      urgency: urgency as "low" | "medium" | "critical",
      category: category as "electrical" | "mechanical" | "hydraulic" | "other",
      description,
      photoPath,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      accuracy: Number.isFinite(Number(form.get("accuracy"))) ? Number(form.get("accuracy")) : null,
      status: "open",
    },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
