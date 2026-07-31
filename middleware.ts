import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth-token";

export async function middleware(req: NextRequest) {
  let token = req.cookies.get(SESSION_COOKIE)?.value;
  const tokenFromUrl = req.nextUrl.searchParams.get("token");

  if (!token && tokenFromUrl) {
    token = tokenFromUrl;
  }

  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const user = await verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  const existingCookie = req.headers.get("cookie") || "";
  if (!existingCookie.includes(SESSION_COOKIE)) {
    requestHeaders.set("cookie", `${existingCookie ? existingCookie + "; " : ""}${SESSION_COOKIE}=${token}`);
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (tokenFromUrl || !req.cookies.get(SESSION_COOKIE)?.value) {
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
