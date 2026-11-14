import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { revokeAllSessions } from "@/lib/auth-guard";

// "Sign out everywhere": every existing session (all browsers and devices)
// stops working. Only reachable when signed in (see src/proxy.ts).
export async function POST(req: NextRequest) {
  await revokeAllSessions();
  const res = NextResponse.redirect(new URL("/login?signedOutEverywhere=1", req.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
