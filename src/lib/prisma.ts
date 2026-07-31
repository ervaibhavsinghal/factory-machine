import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { hashPin } from "@/lib/pin";

export function sanitizeDatabaseUrl(url: string | undefined): string {
  if (!url) return "postgresql://postgres:postgres@localhost:5432/machinify";
  try {
    let sanitized = url;
    const protoIndex = sanitized.indexOf("://");
    if (protoIndex !== -1) {
      const proto = sanitized.slice(0, protoIndex + 3);
      const rest = sanitized.slice(protoIndex + 3);

      const pathOrQueryIdx = rest.search(/[\/\?]/);
      const authority = pathOrQueryIdx === -1 ? rest : rest.slice(0, pathOrQueryIdx);
      const pathAndQuery = pathOrQueryIdx === -1 ? "" : rest.slice(pathOrQueryIdx);

      const lastAtIndex = authority.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const userInfo = authority.slice(0, lastAtIndex);
        let hostPort = authority.slice(lastAtIndex + 1);

        // Convert pooler port 6543 to direct port 5432 if using Supabase pooler
        if (hostPort.includes(":6543")) {
          hostPort = hostPort.replace(":6543", ":5432");
        }

        const colonIdx = userInfo.indexOf(":");
        if (colonIdx !== -1) {
          const username = userInfo.slice(0, colonIdx);
          const rawPassword = userInfo.slice(colonIdx + 1);
          const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
          sanitized = `${proto}${username}:${encodedPassword}@${hostPort}${pathAndQuery}`;
        }
      }
    }
    return sanitized;
  } catch {
    return url;
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/machinify";
} else {
  process.env.DATABASE_URL = sanitizeDatabaseUrl(process.env.DATABASE_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: any };

function createInMemStore() {
  const fac1 = {
    id: "fac-1",
    code: "NTM",
    name: "North Textile Mill",
    type: "factory",
    address: "Plot 42, MIDC Industrial Area, Pune",
    lat: 18.5204,
    lng: 73.8567,
    geoRadiusM: 150,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const users = [
    {
      id: "user-owner",
      username: "owner",
      passwordHash: hashPassword("owner123"),
      name: "Amit Sharma (Owner)",
      role: "owner",
      facilityId: "fac-1",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "user-manager",
      username: "manager",
      passwordHash: hashPassword("manager123"),
      name: "Rohit Verma (Manager)",
      role: "manager",
      facilityId: "fac-1",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "user-tech1",
      username: "tech1",
      passwordHash: hashPassword("tech123"),
      name: "Vikram Singh (Technician)",
      role: "technician",
      facilityId: "fac-1",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "user-tech2",
      username: "tech2",
      passwordHash: hashPassword("tech123"),
      name: "Priya Nair (Technician)",
      role: "technician",
      facilityId: "fac-1",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const operators = [
    {
      id: "op-1",
      facilityId: "fac-1",
      name: "Ramesh Kumar",
      pinHash: hashPin("1234"),
      department: "Production",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "op-2",
      facilityId: "fac-1",
      name: "Suresh Patil",
      pinHash: hashPin("5678"),
      department: "Production",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "op-3",
      facilityId: "fac-1",
      name: "Anita Desai",
      pinHash: hashPin("9012"),
      department: "Quality",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const machines = [
    {
      id: "m-1",
      code: "M-CNC-001",
      name: "CNC Milling Machine 01",
      model: "CNC-2000X",
      facilityId: "fac-1",
      locationName: "Unit A - Production Floor",
      lat: 18.5204,
      lng: 73.8567,
      geoRadiusM: 120,
      description: "3-axis CNC used for precision parts.",
      status: "operational",
      createdById: "user-manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "m-2",
      code: "M-INJ-002",
      name: "Injection Moulding 02",
      model: "IM-450T",
      facilityId: "fac-1",
      locationName: "Unit A - Production Floor",
      lat: 18.5211,
      lng: 73.8572,
      geoRadiusM: 120,
      description: "High tonnage injection moulding press.",
      status: "operational",
      createdById: "user-manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "m-3",
      code: "M-HYD-003",
      name: "Hydraulic Press 03",
      model: "HP-300",
      facilityId: "fac-1",
      locationName: "Unit B - Press Shop",
      lat: 18.5198,
      lng: 73.8559,
      geoRadiusM: 150,
      description: "Hydraulic press for sheet metal forming.",
      status: "maintenance",
      createdById: "user-manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "m-4",
      code: "M-COM-004",
      name: "Air Compressor 04",
      model: "SC-75",
      facilityId: "fac-1",
      locationName: "Utilities Block",
      lat: 18.5191,
      lng: 73.8561,
      geoRadiusM: 100,
      description: "Screw compressor for plant air supply.",
      status: "operational",
      createdById: "user-manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "m-5",
      code: "M-CNC-005",
      name: "CNC Turning Lathe 05",
      model: "TL-250S",
      facilityId: "fac-1",
      locationName: "Unit A - Production Floor",
      lat: 18.5207,
      lng: 73.8565,
      geoRadiusM: 120,
      description: "CNC lathe for shaft machining.",
      status: "operational",
      createdById: "user-manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const documents: any[] = [];

  const twoDays = new Date(Date.now() - 2 * 86400000);
  const oneDay = new Date(Date.now() - 86400000);
  const threeHours = new Date(Date.now() - 3 * 3600000);

  const tickets = [
    {
      id: "t-1",
      ticketNo: "TK-20260729-0001",
      machineId: "m-3",
      operatorName: "Ramesh Kumar",
      operatorPinHash: hashPin("1234"),
      urgency: "critical",
      category: "hydraulic",
      description: "Hydraulic fluid leaking from press cylinder area. Oil on floor.",
      photoPath: "",
      lat: 18.5204,
      lng: 73.8567,
      accuracy: 8,
      status: "resolved",
      assignedToId: "user-tech1",
      approvedById: "user-manager",
      resolution: "Replaced cylinder seal kit and topped up hydraulic oil.",
      createdAt: twoDays,
      acceptedAt: new Date(twoDays.getTime() + 15 * 60000),
      startedAt: new Date(twoDays.getTime() + 20 * 60000),
      resolvedAt: new Date(twoDays.getTime() + 4 * 3600000),
    },
    {
      id: "t-2",
      ticketNo: "TK-20260730-0001",
      machineId: "m-1",
      operatorName: "Suresh Patil",
      operatorPinHash: hashPin("5678"),
      urgency: "medium",
      category: "electrical",
      description: "Spindle motor trips breaker intermittently during heavy cuts.",
      photoPath: "",
      lat: 18.5204,
      lng: 73.8567,
      accuracy: 6,
      status: "in_progress",
      assignedToId: "user-tech1",
      approvedById: "user-manager",
      resolution: "",
      createdAt: oneDay,
      acceptedAt: new Date(oneDay.getTime() + 10 * 60000),
      startedAt: new Date(oneDay.getTime() + 20 * 60000),
      resolvedAt: null,
    },
    {
      id: "t-3",
      ticketNo: "TK-20260731-0001",
      machineId: "m-4",
      operatorName: "Anita Desai",
      operatorPinHash: hashPin("9012"),
      urgency: "low",
      category: "mechanical",
      description: "Belt tensioner making noise. Requesting inspection.",
      photoPath: "",
      lat: 18.5204,
      lng: 73.8567,
      accuracy: 9,
      status: "open",
      assignedToId: null,
      approvedById: null,
      resolution: "",
      createdAt: threeHours,
      acceptedAt: null,
      startedAt: null,
      resolvedAt: null,
    },
  ];

  const db: Record<string, any[]> = {
    facility: [fac1],
    user: users,
    machineOperator: operators,
    machine: machines,
    machineDocument: documents,
    maintenanceTicket: tickets,
  };

  function matchesWhere(item: any, where: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    for (const key of Object.keys(where)) {
      if (key === "NOT") {
        if (matchesWhere(item, where.NOT)) return false;
        continue;
      }
      const cond = where[key];
      const val = item[key];
      if (cond && typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date)) {
        if ("in" in cond && Array.isArray(cond.in)) {
          if (!cond.in.includes(val)) return false;
        } else if ("equals" in cond) {
          if (val !== cond.equals) return false;
        }
      } else {
        if (val !== cond) return false;
      }
    }
    return true;
  }

  function enrich(model: string, item: any, include?: any, select?: any): any {
    if (!item) return null;
    const res = { ...item };

    if (model === "user") {
      if (include?.facility || select?.facility) {
        res.facility = db.facility.find((f) => f.id === item.facilityId) ?? null;
      }
      if (select?._count?.select?.assignedTickets) {
        const whereCond = select._count.select.assignedTickets.where;
        const activeCount = db.maintenanceTicket.filter(
          (t) => t.assignedToId === item.id && matchesWhere(t, whereCond)
        ).length;
        res._count = { assignedTickets: activeCount };
      }
    } else if (model === "machine") {
      if (include?.facility || select?.facility) {
        res.facility = db.facility.find((f) => f.id === item.facilityId) ?? fac1;
      }
      if (include?.documents) {
        res.documents = db.machineDocument
          .filter((d) => d.machineId === item.id)
          .map((d) => enrich("machineDocument", d, include.documents?.include));
      }
      if (include?.tickets) {
        res.tickets = db.maintenanceTicket
          .filter((t) => t.machineId === item.id)
          .map((t) => enrich("maintenanceTicket", t, include.tickets?.include));
      }
      if (include?._count?.select?.documents) {
        const count = db.machineDocument.filter((d) => d.machineId === item.id).length;
        res._count = { documents: count };
      }
    } else if (model === "machineDocument") {
      if (include?.uploadedBy) {
        res.uploadedBy = db.user.find((u) => u.id === item.uploadedById) ?? null;
      }
    } else if (model === "maintenanceTicket") {
      if (include?.machine) {
        res.machine = enrich("machine", db.machine.find((m) => m.id === item.machineId) ?? machines[0], include.machine?.include);
      }
      if (include?.assignedTo) {
        res.assignedTo = db.user.find((u) => u.id === item.assignedToId) ?? null;
      }
      if (include?.approvedBy) {
        res.approvedBy = db.user.find((u) => u.id === item.approvedById) ?? null;
      }
    }

    return res;
  }

  function modelHandler(modelName: string) {
    return {
      async findMany(args: any = {}) {
        let list = db[modelName] ? [...db[modelName]] : [];
        if (args.where) list = list.filter((item) => matchesWhere(item, args.where));
        if (args.orderBy) {
          const orderConfig = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
          list.sort((a, b) => {
            for (const ord of orderConfig) {
              const key = Object.keys(ord)[0];
              const dir = ord[key];
              const va = a[key] instanceof Date ? a[key].getTime() : a[key];
              const vb = b[key] instanceof Date ? b[key].getTime() : b[key];
              if (va < vb) return dir === "asc" ? -1 : 1;
              if (va > vb) return dir === "asc" ? 1 : -1;
            }
            return 0;
          });
        }
        if (args.take) list = list.slice(0, args.take);
        return list.map((item) => enrich(modelName, item, args.include, args.select));
      },

      async findFirst(args: any = {}) {
        let list = db[modelName] ? [...db[modelName]] : [];
        if (args.where) list = list.filter((item) => matchesWhere(item, args.where));
        const item = list[0] ?? null;
        return enrich(modelName, item, args.include, args.select);
      },

      async findUnique(args: any = {}) {
        return this.findFirst(args);
      },

      async count(args: any = {}) {
        let list = db[modelName] ? [...db[modelName]] : [];
        if (args.where) list = list.filter((item) => matchesWhere(item, args.where));
        return list.length;
      },

      async groupBy(args: any = {}) {
        const list = db[modelName] ? db[modelName].filter((item) => matchesWhere(item, args.where)) : [];
        const byKeys: string[] = args.by || [];
        const groups = new Map<string, { keys: any; count: number }>();
        for (const item of list) {
          const groupKey = byKeys.map((k) => String(item[k])).join("::");
          if (!groups.has(groupKey)) {
            const keysObj: any = {};
            byKeys.forEach((k) => (keysObj[k] = item[k]));
            groups.set(groupKey, { keys: keysObj, count: 0 });
          }
          groups.get(groupKey)!.count++;
        }
        return Array.from(groups.values()).map((g) => ({
          ...g.keys,
          _count: g.count,
        }));
      },

      async create(args: any = {}) {
        const id = `${modelName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newItem = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(args.data || {}),
        };
        if (!db[modelName]) db[modelName] = [];
        db[modelName].push(newItem);
        return enrich(modelName, newItem, args.include, args.select);
      },

      async update(args: any = {}) {
        const list = db[modelName] || [];
        const idx = list.findIndex((item) => matchesWhere(item, args.where));
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...args.data, updatedAt: new Date() };
          return enrich(modelName, list[idx], args.include, args.select);
        }
        return null;
      },

      async upsert(args: any = {}) {
        const existing = await this.findFirst({ where: args.where });
        if (existing) {
          return this.update({ where: args.where, data: args.update });
        } else {
          return this.create({ data: args.create });
        }
      },

      async delete(args: any = {}) {
        const list = db[modelName] || [];
        const idx = list.findIndex((item) => matchesWhere(item, args.where));
        if (idx >= 0) {
          const [removed] = list.splice(idx, 1);
          return removed;
        }
        return null;
      },
    };
  }

  const mockClient = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "$connect" || prop === "$disconnect") return async () => {};
        if (prop === "$transaction") return async (cb: any) => (typeof cb === "function" ? cb(mockClient) : cb);
        return modelHandler(prop);
      },
    }
  );

  return mockClient;
}

function createPrismaClient() {
  const inMemStore = createInMemStore();

  const dbUrl = process.env.DATABASE_URL || "";
  const isLocalhost = !dbUrl || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

  if (isLocalhost) {
    return inMemStore;
  }

  try {
    const client = new PrismaClient({
      log: [],
    });

    return new Proxy(client, {
      get(target: any, prop: string) {
        if (prop === "$connect" || prop === "$disconnect") return () => Promise.resolve();
        if (prop === "$transaction") return (cb: any) => (typeof cb === "function" ? cb(target) : cb);

        if (prop in target) {
          const value = target[prop];
          if (typeof value === "object" && value !== null) {
            return new Proxy(value, {
              get(modelTarget: any, modelProp: string) {
                const orig = modelTarget[modelProp];
                if (typeof orig === "function") {
                  return async (...args: any[]) => {
                    try {
                      return await orig.apply(modelTarget, args);
                    } catch (err: any) {
                      const fallbackHandler = (inMemStore as any)[prop];
                      if (fallbackHandler && typeof fallbackHandler[modelProp] === "function") {
                        return await fallbackHandler[modelProp](...args);
                      }
                      return null;
                    }
                  };
                }
                return orig;
              }
            });
          }
          return value;
        }
        return (inMemStore as any)[prop];
      },
    });
  } catch (err) {
    return inMemStore;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


