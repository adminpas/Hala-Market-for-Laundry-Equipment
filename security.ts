import { db } from "@/db";
import { auditLogs, securityEvents, blocklist } from "@/db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ *
 *  AI SECURITY ENGINE
 *  Heuristic + behavioural scoring that protects every request:
 *  intrusion, injection, bots, brute force, fraud, phishing links.
 * ------------------------------------------------------------------ */

export function clientIp(req: Request) {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

/* ---------- in-memory sliding-window rate limiter ---------- */
type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  b.hits.push(now);
  buckets.set(key, b);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.hits.length === 0 || now - v.hits[v.hits.length - 1] > windowMs) buckets.delete(k);
  }
  return { ok: b.hits.length <= limit, count: b.hits.length, remaining: Math.max(0, limit - b.hits.length) };
}

/* ---------- threat signatures ---------- */
const SQLI = /(\bunion\b.*\bselect\b|\bor\b\s+1\s*=\s*1|;\s*drop\s+table|--\s|\/\*.*\*\/|xp_cmdshell|information_schema)/i;
const XSS = /(<script|javascript:|onerror\s*=|onload\s*=|<iframe|document\.cookie|eval\()/i;
const PATH = /(\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/self|c:\\windows)/i;
const CMD = /(\|\s*(sh|bash|curl|wget)\b|`.*`|\$\(.*\))/i;
const ATTACK_TOOL = /(sqlmap|nikto|nmap|masscan|havij|acunetix|dirbuster|hydra|zgrab|wpscan|metasploit)/i;
const GENERIC_CLIENT = /(python-requests|curl\/|wget|go-http|okhttp|postman)/i;

/** Trusted domains for outbound/inbound links (anti-phishing). */
const TRUSTED = ["najeeb", "wa.me", "whatsapp.com", "maps.google", "google.com", "youtube.com", "youtu.be", "vimeo.com", "commondatastorage.googleapis.com", "localhost"];
const SHORTENERS = ["bit.ly", "tinyurl", "goo.gl", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl", "ow.ly"];

export type Threat = { score: number; kind: string; detail: string; severity: "low" | "medium" | "high" | "critical" };

/** Scan any user-supplied payload for attack signatures. */
export function scanPayload(payload: unknown, path = ""): Threat | null {
  let text = "";
  try { text = typeof payload === "string" ? payload : JSON.stringify(payload ?? ""); } catch { return null; }
  if (!text) return null;
  const checks: [RegExp, string, number, Threat["severity"]][] = [
    [SQLI, "injection", 95, "critical"],
    [CMD, "injection", 90, "critical"],
    [PATH, "injection", 80, "high"],
    [XSS, "injection", 75, "high"],
  ];
  for (const [re, kind, score, severity] of checks) {
    const m = text.match(re);
    if (m) return { score, kind, severity, detail: `نمط هجوم (${kind}) في ${path}: ${m[0].slice(0, 60)}` };
  }
  return null;
}

/** Validate a URL against phishing / fake-link heuristics. */
export function checkLink(url: string): Threat | null {
  if (!url) return null;
  const u = url.toLowerCase().trim();
  if (u.startsWith("javascript:") || u.startsWith("data:text/html"))
    return { score: 95, kind: "phishing", severity: "critical", detail: "رابط تنفيذ نصوص خطير" };
  if (SHORTENERS.some((s) => u.includes(s)))
    return { score: 60, kind: "phishing", severity: "medium", detail: "رابط مختصر مجهول الوجهة" };
  // punycode / homograph
  if (u.includes("xn--")) return { score: 70, kind: "phishing", severity: "high", detail: "نطاق يستخدم أحرفاً مشابهة (homograph)" };
  // credentials embedded
  if (/https?:\/\/[^/@\s]+@/.test(u)) return { score: 80, kind: "phishing", severity: "high", detail: "رابط يحتوي بيانات دخول مضمّنة" };
  // raw IP host
  if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(u)) return { score: 55, kind: "phishing", severity: "medium", detail: "رابط بعنوان IP مباشر" };
  if (u.startsWith("http://") && !u.includes("localhost"))
    return { score: 35, kind: "phishing", severity: "low", detail: "رابط غير مشفّر (HTTP)" };
  return null;
}

export function isTrustedLink(url: string) {
  try { const h = new URL(url).hostname.toLowerCase(); return TRUSTED.some((t) => h.includes(t)); } catch { return false; }
}

export function detectBot(ua: string): Threat | null {
  if (ATTACK_TOOL.test(ua)) return { score: 90, kind: "bot", severity: "critical", detail: `أداة فحص/اختراق: ${ua.slice(0, 50)}` };
  if (!ua) return { score: 35, kind: "bot", severity: "low", detail: "طلب بدون User-Agent" };
  if (GENERIC_CLIENT.test(ua)) return { score: 25, kind: "bot", severity: "low", detail: `عميل آلي: ${ua.slice(0, 40)}` };
  return null;
}

/* ---------- fraud scoring for orders ---------- */
export type FraudInput = {
  amount: number; distanceKm: number; accountAgeMin: number;
  ordersLastHour: number; phone: string; sameIpAccounts: number;
};

export function fraudScore(i: FraudInput): { score: number; reasons: string[]; action: "allow" | "review" | "block" } {
  let s = 0; const r: string[] = [];
  if (i.amount > 150000) { s += 25; r.push("قيمة الطلب مرتفعة جداً"); }
  if (i.accountAgeMin < 3) { s += 25; r.push("حساب أُنشئ قبل دقائق"); }
  if (i.ordersLastHour >= 4) { s += 30; r.push(`${i.ordersLastHour} طلبات خلال ساعة`); }
  if (i.sameIpAccounts >= 3) { s += 25; r.push("عدة حسابات من نفس الـIP"); }
  if (i.distanceKm > 1200) { s += 10; r.push("مسافة توصيل بعيدة جداً"); }
  if (!/^0(5\d{8}|1\d{8})$/.test(i.phone)) { s += 20; r.push("رقم جوال بصيغة غير سعودية"); }
  if (/^(\d)\1+$/.test(i.phone.replace(/^0/, ""))) { s += 25; r.push("رقم جوال نمطي مكرر"); }
  return { score: Math.min(100, s), reasons: r, action: s >= 70 ? "block" : s >= 40 ? "review" : "allow" };
}

/* ---------- persistence ---------- */
export async function logSecurity(e: {
  kind: string; severity?: string; score?: number; ip?: string; path?: string; detail?: string; blocked?: boolean;
}) {
  try {
    await db.insert(securityEvents).values({
      kind: e.kind as never,
      severity: (e.severity ?? "low") as never,
      score: e.score ?? 0,
      ip: e.ip ?? "",
      path: e.path ?? "",
      detail: e.detail ?? "",
      blocked: !!e.blocked,
    });
  } catch {}
}

export async function audit(e: {
  actorType: "admin" | "customer" | "guest" | "system";
  actorId?: string; action: string; entity?: string; entityId?: string;
  ip?: string; userAgent?: string; meta?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      actorType: e.actorType, actorId: e.actorId ?? "", action: e.action,
      entity: e.entity ?? "", entityId: e.entityId ?? "", ip: e.ip ?? "",
      userAgent: (e.userAgent ?? "").slice(0, 200), meta: e.meta ?? {},
    });
  } catch {}
}

/** Never auto-block loopback/private ranges (local admin, LAN, health checks). */
export function isSafeIp(ip: string) {
  return (
    ip === "0.0.0.0" || ip === "::1" || ip === "127.0.0.1" ||
    ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.") || ip.startsWith("::ffff:127.")
  );
}

export async function isBlocked(value: string) {
  if (isSafeIp(value)) return false;
  const now = new Date();
  const [row] = await db
    .select()
    .from(blocklist)
    .where(and(eq(blocklist.value, value), sql`(${blocklist.until} is null or ${blocklist.until} > ${now})`));
  return !!row;
}

export async function blockValue(value: string, type: "ip" | "phone", reason: string, minutes = 60) {
  if (type === "ip" && isSafeIp(value)) return; // never lock out local/admin networks
  try {
    const until = new Date(Date.now() + minutes * 60000);
    const [existing] = await db.select().from(blocklist).where(eq(blocklist.value, value));
    if (existing) {
      await db.update(blocklist).set({ reason, until }).where(eq(blocklist.value, value));
    } else {
      await db.insert(blocklist).values({ value, type, reason, until });
    }
  } catch {}
}

/** Full request guard used by API routes. */
export async function guard(req: Request, opts: { limit?: number; windowMs?: number; payload?: unknown; path?: string } = {}) {
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") ?? "";
  const path = opts.path ?? new URL(req.url).pathname;

  if (await isBlocked(ip)) {
    await logSecurity({ kind: "anomaly", severity: "high", ip, path, detail: "طلب من عنوان محظور", blocked: true, score: 100 });
    return { ok: false, status: 403, error: "تم حظر هذا العنوان مؤقتاً لأسباب أمنية" };
  }

  const bot = detectBot(ua);
  if (bot && bot.score >= 90) {
    await logSecurity({ ...bot, ip, path, blocked: true });
    await blockValue(ip, "ip", bot.detail, 240);
    return { ok: false, status: 403, error: "تم رفض الطلب" };
  }

  const rl = rateLimit(`${ip}:${path}`, opts.limit ?? 60, opts.windowMs ?? 60000);
  if (!rl.ok) {
    await logSecurity({ kind: "rate_limit", severity: "medium", ip, path, detail: `تجاوز الحد (${rl.count})`, blocked: true, score: 50 });
    if (rl.count > (opts.limit ?? 60) * 3) await blockValue(ip, "ip", "إغراق بالطلبات", 30);
    return { ok: false, status: 429, error: "طلبات كثيرة جداً، حاول بعد قليل" };
  }

  if (opts.payload !== undefined) {
    const t = scanPayload(opts.payload, path);
    if (t) {
      await logSecurity({ ...t, ip, path, blocked: true });
      await blockValue(ip, "ip", t.detail, 120);
      return { ok: false, status: 400, error: "تم رفض المدخلات لأسباب أمنية" };
    }
  }
  return { ok: true as const, ip, ua };
}

/* ---------- reporting ---------- */
export async function securityReport() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [events, logs, blocks] = await Promise.all([
    db.select().from(securityEvents).where(gt(securityEvents.createdAt, since)).orderBy(desc(securityEvents.id)).limit(200),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(100),
    db.select().from(blocklist).orderBy(desc(blocklist.id)).limit(50),
  ]);
  const by = (k: string) => events.filter((e) => e.kind === k).length;
  const critical = events.filter((e) => e.severity === "critical" || e.severity === "high").length;
  const blocked = events.filter((e) => e.blocked).length;
  const health = Math.max(0, 100 - critical * 4 - by("rate_limit"));
  return {
    events, logs, blocks,
    stats: {
      total: events.length, blocked, critical,
      injection: by("injection"), phishing: by("phishing"), bots: by("bot"),
      rateLimit: by("rate_limit"), fraud: by("fraud"), loginFail: by("login_fail"),
      health: Math.round(health),
    },
  };
}
