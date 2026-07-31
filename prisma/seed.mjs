import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes, createHmac } from "node:crypto";

const prisma = new PrismaClient();
const PIN_SECRET = process.env.PIN_SECRET || "machinify-pin-secret";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function hashPin(pin) {
  return createHmac("sha256", PIN_SECRET).update(String(pin)).digest("hex");
}

const DEFAULT_LL = { lat: 18.5204, lng: 73.8567 };

async function main() {
  console.log("Seeding…");

  const facility =
    (await prisma.facility.findUnique({ where: { code: "NTM" } })) ??
    (await prisma.facility.create({
      data: {
        code: "NTM",
        name: "North Textile Mill",
        type: "factory",
        address: "Plot 42, MIDC Industrial Area, Pune",
        ...DEFAULT_LL,
        geoRadiusM: 150,
      },
    }));

  const seedUsers = [
    ["owner", "owner123", "Amit Sharma (Owner)", "owner"],
    ["manager", "manager123", "Rohit Verma (Manager)", "manager"],
    ["tech1", "tech123", "Vikram Singh (Technician)", "technician"],
    ["tech2", "tech123", "Priya Nair (Technician)", "technician"],
  ];
  for (const [username, password, name, role] of seedUsers) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      await prisma.user.create({
        data: { username, passwordHash: hashPassword(password), name, role, facilityId: facility.id },
      });
    }
  }

  const machineSeeds = [
    ["M-CNC-001", "CNC Milling Machine 01", "CNC-2000X", "Unit A - Production Floor", 18.5204, 73.8567, 120, "3-axis CNC used for precision parts."],
    ["M-INJ-002", "Injection Moulding 02", "IM-450T", "Unit A - Production Floor", 18.5211, 73.8572, 120, "High tonnage injection moulding press."],
    ["M-HYD-003", "Hydraulic Press 03", "HP-300", "Unit B - Press Shop", 18.5198, 73.8559, 150, "Hydraulic press for sheet metal forming."],
    ["M-COM-004", "Air Compressor 04", "SC-75", "Utilities Block", 18.5191, 73.8561, 100, "Screw compressor for plant air supply."],
    ["M-CNC-005", "CNC Turning Lathe 05", "TL-250S", "Unit A - Production Floor", 18.5207, 73.8565, 120, "CNC lathe for shaft machining."],
  ];
  const machineIds = new Map();
  for (const [code, name, model, loc, lat, lng, radius, desc] of machineSeeds) {
    let machine = await prisma.machine.findUnique({ where: { code } });
    if (!machine) {
      machine = await prisma.machine.create({
        data: {
          code,
          name,
          model,
          facilityId: facility.id,
          locationName: loc,
          lat,
          lng,
          geoRadiusM: radius,
          description: desc,
        },
      });
    }
    machineIds.set(code, machine.id);
  }

  const workerSeeds = [
    ["Ramesh Kumar", "1234", "Production"],
    ["Suresh Patil", "5678", "Production"],
    ["Anita Desai", "9012", "Quality"],
  ];
  const workerHash = new Map();
  for (const [name, pin, dept] of workerSeeds) {
    const h = hashPin(pin);
    const exists = await prisma.machineOperator.findUnique({ where: { pinHash: h } });
    if (!exists) {
      await prisma.machineOperator.create({
        data: { name, pinHash: h, department: dept, facilityId: facility.id },
      });
    }
    workerHash.set(name, h);
  }

  const tech1 = await prisma.user.findUnique({ where: { username: "tech1" } });
  const tech2 = await prisma.user.findUnique({ where: { username: "tech2" } });
  const hyd = await prisma.machine.findUnique({ where: { code: "M-HYD-003" } });
  const cnc = await prisma.machine.findUnique({ where: { code: "M-CNC-001" } });
  const comp = await prisma.machine.findUnique({ where: { code: "M-COM-004" } });

  const existing = await prisma.maintenanceTicket.count();
  if (existing === 0) {
    const twoDays = new Date(Date.now() - 2 * 86400000);
    const oneDay = new Date(Date.now() - 86400000);
    const threeHours = new Date(Date.now() - 3 * 3600000);

    await prisma.maintenanceTicket.create({
      data: {
        ticketNo: `TK-${twoDays.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
        machineId: hyd.id,
        operatorName: "Ramesh Kumar",
        operatorPinHash: workerHash.get("Ramesh Kumar"),
        urgency: "critical",
        category: "hydraulic",
        description: "Hydraulic fluid leaking from the press cylinder area. Oil on the floor.",
        lat: DEFAULT_LL.lat,
        lng: DEFAULT_LL.lng,
        accuracy: 8,
        status: "resolved",
        assignedToId: tech1.id,
        resolution: "Replaced the cylinder seal kit and topped up hydraulic oil. Pressure restored to spec.",
        createdAt: twoDays,
        acceptedAt: new Date(twoDays.getTime() + 15 * 60000),
        startedAt: new Date(twoDays.getTime() + 20 * 60000),
        resolvedAt: new Date(twoDays.getTime() + 4 * 3600000),
      },
    });

    await prisma.maintenanceTicket.create({
      data: {
        ticketNo: `TK-${oneDay.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
        machineId: cnc.id,
        operatorName: "Suresh Patil",
        operatorPinHash: workerHash.get("Suresh Patil"),
        urgency: "medium",
        category: "electrical",
        description: "Spindle motor trips the breaker intermittently during heavy cuts.",
        lat: DEFAULT_LL.lat,
        lng: DEFAULT_LL.lng,
        accuracy: 6,
        status: "in_progress",
        assignedToId: tech1.id,
        approvedById: tech1.id,
        createdAt: new Date(oneDay.getTime() + 9.5 * 3600000),
        startedAt: new Date(oneDay.getTime() + 10.25 * 3600000),
      },
    });

    await prisma.maintenanceTicket.create({
      data: {
        ticketNo: `TK-${threeHours.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
        machineId: comp.id,
        operatorName: "Anita Desai",
        operatorPinHash: workerHash.get("Anita Desai"),
        urgency: "low",
        category: "mechanical",
        description: "Belt tensioner making noise. Requesting inspection during next service.",
        lat: DEFAULT_LL.lat,
        lng: DEFAULT_LL.lng,
        accuracy: 9,
        status: "open",
        createdAt: threeHours,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
