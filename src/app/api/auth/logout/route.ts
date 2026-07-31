import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-token";

export async function POST() {
  await destroySession();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
