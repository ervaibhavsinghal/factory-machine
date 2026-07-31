import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fm.session";
const AUTH_SECRET = process.env.AUTH_SECRET || "machinify-dev-auth-secret";
const secret = new TextEncoder().encode(AUTH_SECRET);
const SESSION_TTL = 60 * 60 * 12; // 12 hours

export type SessionRole = "owner" | "manager" | "technician" | "guard";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: SessionRole;
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      username: (payload.username as string) ?? "",
      name: (payload.name as string) ?? "",
      role: (payload.role as SessionRole) ?? "owner",
    };
  } catch {
    return null;
  }
}
