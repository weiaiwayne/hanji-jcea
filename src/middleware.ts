import { NextRequest, NextResponse } from "next/server";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

// API routes the public site uses. While the editorial system is shelved,
// every other API route 404s here instead of relying on auth alone.
const PUBLIC_API = [
  /^\/api\/articles\/\d+\/citation$/,
  /^\/api\/ai-assets\/\d+\/audio$/,
  /^\/api\/health$/,
  /^\/api\/auth\/logout$/,
];

export function middleware(req: NextRequest) {
  if (EDITORIAL_SYSTEM_ENABLED) return NextResponse.next();
  const path = req.nextUrl.pathname; // basePath already stripped
  if (PUBLIC_API.some((re) => re.test(path))) return NextResponse.next();
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const config = { matcher: "/api/:path*" };
