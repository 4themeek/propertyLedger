import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";
import {
  clearFailedLogins,
  clientIp,
  lockMinutesRemaining,
  recordFailedLogin,
  safeNextPath,
} from "@/lib/auth-guard";

function backToLogin(req: NextRequest, next: string, params: Record<string, string>) {
  const url = new URL("/login", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(form.get("next"));

  const storedHash = process.env.APP_PASSWORD_HASH;
  if (!storedHash) {
    return NextResponse.json(
      { error: "Server is not configured (APP_PASSWORD_HASH missing)" },
      { status: 500 }
    );
  }

  const ip = clientIp(req.headers);
  const lockedFor = await lockMinutesRemaining(ip);
  if (lockedFor > 0) {
    return backToLogin(req, next, { locked: String(lockedFor) });
  }

  const valid = await verifyPassword(password, storedHash);
  if (!valid) {
    await recordFailedLogin(ip);
    return backToLogin(req, next, { error: "1" });
  }

  await clearFailedLogins(ip);
  const token = await createSessionToken();
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
