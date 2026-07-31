import type { Role, TicketStatus, Urgency, Category, MachineStatus } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  technician: "Technician",
  guard: "Guard",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  low: "Low",
  medium: "Medium",
  critical: "CRITICAL",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  electrical: "Electrical",
  mechanical: "Mechanical",
  hydraulic: "Hydraulic",
  other: "Other",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  operational: "Operational",
  maintenance: "Under Maintenance",
  down: "Down",
};

export const URGENCY_BADGE: Record<Urgency, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export const CATEGORY_BADGE: Record<Category, string> = {
  electrical: "bg-yellow-100 text-yellow-800",
  mechanical: "bg-blue-100 text-blue-700",
  hydraulic: "bg-cyan-100 text-cyan-800",
  other: "bg-slate-200 text-slate-700",
};

export const STATUS_BADGE: Record<TicketStatus, string> = {
  open: "bg-slate-200 text-slate-700",
  assigned: "bg-indigo-100 text-indigo-700",
  accepted: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export const MACHINE_STATUS_BADGE: Record<MachineStatus, string> = {
  operational: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-amber-100 text-amber-700",
  down: "bg-red-100 text-red-700",
};
