import { createHmac } from "node:crypto";

const PIN_SECRET = process.env.PIN_SECRET || "machinify-pin-secret";

export function hashPin(pin: string): string {
  return createHmac("sha256", PIN_SECRET).update(String(pin).trim()).digest("hex");
}
