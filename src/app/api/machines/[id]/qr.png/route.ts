import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const machine = await prisma.machine.findUnique({ where: { id } });
  if (!machine) {
    return NextResponse.json({ error: "Machine not found." }, { status: 404 });
  }
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const url = `${proto}://${host}/operator?m=${machine.code}`;
  const buf = await QRCode.toBuffer(url, { width: 600, margin: 2, color: { dark: "#0f172a" } });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${machine.code}-qr.png"`,
      "Cache-Control": "no-store",
    },
  });
}
