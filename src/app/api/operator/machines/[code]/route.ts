import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const machine = await prisma.machine.findUnique({
    where: { code: code.toUpperCase() },
    include: { facility: true },
  });
  if (!machine) {
    return NextResponse.json(
      { error: "Machine not found. Please scan a valid machine QR code." },
      { status: 404 }
    );
  }
  return NextResponse.json({
    machine: {
      code: machine.code,
      name: machine.name,
      model: machine.model,
      factory: machine.facility.name,
      locationName: machine.locationName,
      description: machine.description,
      lat: machine.lat,
      lng: machine.lng,
      geoRadiusM: machine.geoRadiusM,
    },
  });
}
