import { cookies } from "next/headers";
import { signSession, verifyToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth-token";

const SESSION_TTL = 60 * 60 * 12;

export async function createSession(user: SessionUser): Promise<string> {
  const token = await signSession(user);
  try {
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL,
      secure: process.env.NODE_ENV === "production",
    });
  } catch (e) {
    console.error("Error setting cookie in createSession:", e);
  }
  return token;
}

export async function destroySession(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    store.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  } catch (e) {
    console.error("Error deleting cookie in destroySession:", e);
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

