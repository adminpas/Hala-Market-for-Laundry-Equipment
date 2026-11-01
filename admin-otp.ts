import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adminOtpChallenges } from "@/db/schema";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be configured before OTP");
  return value;
}
function hash(code: string) { return createHmac("sha256", secret()).update(code).digest("hex"); }
function equal(a: string, b: string) { const aa = Buffer.from(a, "hex"); const bb = Buffer.from(b, "hex"); return aa.length === bb.length && timingSafeEqual(aa, bb); }

async function deliverOtp(destination: string, code: string) {
  const webhook = process.env.OTP_WEBHOOK_URL;
  if (!webhook) return { ok: false as const, error: "لم يتم تهيئة مزود OTP الآمن" };
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.OTP_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN}` } : {}) },
    body: JSON.stringify({ destination, code, channel: destination.includes("@") ? "email" : "sms" }),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok ? { ok: true as const } : { ok: false as const, error: "تعذر إرسال رمز التحقق" };
}

export async function requestAdminOtp(accountType: "owner" | "assistant", accountId: number, destination: string, ip = "") {
  if (!destination) return { ok: false as const, error: "أدخل رقم الجوال أو البريد الإلكتروني" };
  const code = String(randomInt(100000, 1000000));
  await db.insert(adminOtpChallenges).values({ accountType, accountId, phone: destination, codeHash: hash(code), expiresAt: new Date(Date.now() + 300000), attempts: 0, used: false, ip });
  const delivery = await deliverOtp(destination, code);
  if (!delivery.ok) return delivery;
  return { ok: true as const, expiresIn: 300 };
}

export async function verifyAdminOtp(accountType: "owner" | "assistant", accountId: number, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const [challenge] = await db.select().from(adminOtpChallenges).where(and(eq(adminOtpChallenges.accountType, accountType), eq(adminOtpChallenges.accountId, accountId), eq(adminOtpChallenges.used, false), gt(adminOtpChallenges.expiresAt, new Date()))).orderBy(desc(adminOtpChallenges.createdAt)).limit(1);
  if (!challenge || challenge.attempts >= 5) return false;
  const valid = equal(hash(code), challenge.codeHash);
  await db.update(adminOtpChallenges).set({ attempts: challenge.attempts + 1, used: valid }).where(eq(adminOtpChallenges.id, challenge.id));
  return valid;
}
