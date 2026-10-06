import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

const COOKIE = "jcea_session";
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  // Never fall back to a known secret in production — forged sessions would verify
  throw new Error("SESSION_SECRET must be set in production");
}
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "jcea-dev-secret-change-in-production-0451"
);

export type Role = "author" | "reviewer" | "editor" | "eic" | "admin";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  roles: Role[];
  affiliation: string;
}

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  affiliation: string;
  country: string;
  orcid: string;
  roles: string;
  active: number;
  created_at: string;
}

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string): boolean {
  return bcrypt.compareSync(pw, hash);
}

export async function createSession(user: DbUser) {
  const token = await new SignJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    // Re-read from DB so role changes and deactivation take effect immediately
    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ? AND active = 1")
      .get(id) as DbUser | undefined;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.split(",").map((r) => r.trim()) as Role[],
      affiliation: user.affiliation,
    };
  } catch {
    return null;
  }
}

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  if (!user) return false;
  if (user.roles.includes("admin")) return true;
  return roles.some((r) => user.roles.includes(r));
}

export function isEditor(user: SessionUser | null): boolean {
  return hasRole(user, "editor", "eic");
}

/** Server-component guard: redirects to login if not authenticated / authorized. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles.length > 0 && !hasRole(user, ...roles)) redirect("/login?denied=1");
  return user;
}

/** API-route guard: returns null instead of redirecting. */
export async function apiUser(...roles: Role[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (roles.length > 0 && !hasRole(user, ...roles)) return null;
  return user;
}
