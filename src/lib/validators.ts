import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required.").max(100),
  password: z.string().min(1, "Password is required.").max(200),
});

export const machineSchema = z.object({
  name: z.string().trim().min(2, "Machine name is required.").max(200),
  code: z.string().trim().toUpperCase().optional(),
  model: z.string().trim().max(200).optional(),
  facilityId: z.string().min(1, "Please select a facility."),
  locationName: z.string().trim().max(200).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  geoRadiusM: z.coerce.number().int().min(10).max(5000).default(100),
  description: z.string().trim().max(2000).optional(),
});

export const operatorSchema = z.object({
  name: z.string().trim().min(2, "Worker name is required.").max(200),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits."),
  department: z.string().trim().max(200).optional(),
  facilityId: z.string().optional(),
});

export const resolveSchema = z.object({
  resolution: z.string().trim().min(10, "Please log what was fixed (minimum 10 characters)."),
});

export const operatorTicketSchema = z.object({
  machineCode: z.string().trim().min(1),
  urgency: z.enum(["low", "medium", "critical"]),
  category: z.enum(["electrical", "mechanical", "hydraulic", "other"]),
  description: z.string().trim().min(5, "Please describe the issue briefly.").max(2000),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits."),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  accuracy: z.coerce.number().optional(),
});

export const ticketLookupSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN."),
});
