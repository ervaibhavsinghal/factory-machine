import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const PHOTO_DIR = path.join(UPLOAD_DIR, "photos");
export const DOC_DIR = path.join(UPLOAD_DIR, "docs");

export function ensureDirs() {
  for (const dir of [UPLOAD_DIR, PHOTO_DIR, DOC_DIR]) fs.mkdirSync(dir, { recursive: true });
}

function extOf(name: string): string {
  const ext = path.extname(name || "").toLowerCase();
  return ext.length >= 1 && ext.length <= 12 ? ext : "";
}

export async function saveUpload(file: File, dir: string): Promise<{ filename: string; size: number; mimeType: string }> {
  ensureDirs();
  const filename = `${Date.now()}_${randomBytes(8).toString("hex")}${extOf(file.name)}`;
  const abs = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(abs, buf);
  return { filename, size: file.size, mimeType: file.type };
}
