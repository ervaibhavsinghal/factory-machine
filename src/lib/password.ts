import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && timingSafeEqual(test, expected);
}
