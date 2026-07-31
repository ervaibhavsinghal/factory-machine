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

  // Explicitly append Set-Cookie headers for all variants to ensure browser deletion
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`
  );
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=None; Secure`
  );
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`
  );

  return res;
}
