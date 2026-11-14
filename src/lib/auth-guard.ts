// Sign-in protections that need the database: failed-attempt lockout and
// "Sign out everywhere". Pure crypto lives in auth.ts.
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authState, loginAttempts } from "@/db/schema";

// ---------------------------------------------------------------------------
// Return-path check for ?next= (prevents redirecting to another site).
// ---------------------------------------------------------------------------

/** Only same-site paths like "/leases/3" are allowed; anything else becomes "/". */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return "/";
  return next;
}

// ---------------------------------------------------------------------------
// Failed sign-in limiting.
// ---------------------------------------------------------------------------

export const LOGIN_LIMITS = {
  /** Failures from one IP within the window before it is locked. */
  perIpFailures: 5,
  /** Failures from all IPs within the window before everyone is locked (backstop). */
  globalFailures: 100,
  windowMinutes: 15,
  lockMinutes: 15,
};

/**
 * Client IP from headers the hosting platform sets itself. On Vercel,
 * x-real-ip / x-forwarded-for are overwritten by the platform; on Cloudflare,
 * cf-connecting-ip is. A header the client could forge is never preferred.
 */
export function clientIp(headers: Headers): string {
  const pick = (name: string) => headers.get(name)?.split(",")[0]?.trim() || "";
  const ip = process.env.VERCEL
    ? pick("x-real-ip") || pick("x-forwarded-for")
    : pick("cf-connecting-ip") || pick("x-real-ip") || pick("x-forwarded-for");
  return ip || "unknown";
}

function ipKey(ip: string) {
  return `ip:${ip}`;
}
const GLOBAL_KEY = "global";

/** Minutes left on a lock for this IP (or the global backstop), or 0 if sign-in is allowed. */
export async function lockMinutesRemaining(ip: string): Promise<number> {
  const rows = await db
    .select({ lockedUntil: loginAttempts.lockedUntil })
    .from(loginAttempts)
    .where(sql`${loginAttempts.key} in (${ipKey(ip)}, ${GLOBAL_KEY})`);
  const now = Date.now();
  let until = 0;
  for (const r of rows) if (r.lockedUntil && r.lockedUntil.getTime() > now) until = Math.max(until, r.lockedUntil.getTime());
  // Lock times come from the database clock; cap the display so small clock
  // differences between the database and this server never show "16 minutes".
  return until ? Math.min(LOGIN_LIMITS.lockMinutes, Math.max(1, Math.ceil((until - now) / 60000))) : 0;
}

async function bump(key: string, limit: number) {
  const { windowMinutes, lockMinutes } = LOGIN_LIMITS;
  // One statement: start a new window if the old one expired, count the failure,
  // and lock when the count reaches the limit.
  await db.execute(sql`
    insert into login_attempts (key, failures, window_start, locked_until)
    values (${key}, 1, now(), null)
    on conflict (key) do update set
      failures = case when login_attempts.window_start < now() - make_interval(mins => ${windowMinutes})
                      then 1 else login_attempts.failures + 1 end,
      window_start = case when login_attempts.window_start < now() - make_interval(mins => ${windowMinutes})
                          then now() else login_attempts.window_start end,
      locked_until = case when (case when login_attempts.window_start < now() - make_interval(mins => ${windowMinutes})
                                     then 1 else login_attempts.failures + 1 end) >= ${limit}
                          then now() + make_interval(mins => ${lockMinutes})
                          else login_attempts.locked_until end
  `);
}

export async function recordFailedLogin(ip: string) {
  await bump(ipKey(ip), LOGIN_LIMITS.perIpFailures);
  await bump(GLOBAL_KEY, LOGIN_LIMITS.globalFailures);
}

export async function clearFailedLogins(ip: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, ipKey(ip)));
}

// ---------------------------------------------------------------------------
// "Sign out everywhere": sessions issued before this time are rejected.
// Cached per server instance for up to a minute to keep page loads fast.
// ---------------------------------------------------------------------------

const CACHE_MS = 60_000;
let cached: { validAfter: number; fetchedAt: number } | null = null;

export async function sessionsValidAfter(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.validAfter;
  const [row] = await db
    .select({ t: authState.sessionsValidAfter })
    .from(authState)
    .where(eq(authState.id, 1))
    .limit(1);
  const validAfter = row ? row.t.getTime() : 0;
  cached = { validAfter, fetchedAt: Date.now() };
  return validAfter;
}

export async function revokeAllSessions() {
  const now = new Date();
  await db
    .insert(authState)
    .values({ id: 1, sessionsValidAfter: now })
    .onConflictDoUpdate({ target: authState.id, set: { sessionsValidAfter: now } });
  cached = { validAfter: now.getTime(), fetchedAt: Date.now() };
}
