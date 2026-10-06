import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { BASE_PATH } from "@/lib/basePath";

export async function POST(req: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL(`${BASE_PATH}/`, req.url), 303);
}
