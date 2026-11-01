import { insertReturningQuery } from "@/db/helpers";
import { cookies, headers } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { adminAssistants, adminCredentials } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/customer";
import { CREDENTIAL_MAXIMUM, CREDENTIAL_MINIMUM, isCredentialText } from "@/lib/credentials";

export const ADMIN_COOKIE = "lx_admin";
const TOKEN_VERSION = "v5";
const OWNER_USERNAME = "NajeebAdmin";
export const DEFAULT_ADMIN_USERNAME = OWNER_USERNAME;
export const DEFAULT_ADMIN_PASSWORD = "Najeeb@2026!";
export type AdminPermission = "products" | "orders" | "maintenance" | "content" | "reports" | "security";
export type AdminIdentity = { role: "owner" | "assistant"; id: number; username: string; mustChangePassword: boolean; permissions: AdminPermission[] };

export function adminPassword() { return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD; }
function sessionSecret() { return process.env.SESSION_SECRET || createHash("sha256").update(`najeeb-preview-session:${adminPassword()}`).digest("hex"); }
function safeEqual(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
function csv(name: string) { return (process.env[name] || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean); }

export async function ensureAdminCredential() {
  let [row] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, OWNER_USERNAME));
  if (!row) {
    const [legacy] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, "owner"));
    if (legacy) {
      await db.update(adminCredentials).set({ username: OWNER_USERNAME, updatedAt: new Date() }).where(eq(adminCredentials.id, legacy.id));
      [row] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, OWNER_USERNAME));
    }
  }
  if (row) return row;
  const [created] = await insertReturningQuery(db.insert(adminCredentials).values({ username: OWNER_USERNAME, passwordHash: hashPassword(adminPassword()), sessionVersion: 1, phone: "", email: "", otpEnabled: false }), adminCredentials);
  if (created) return created;
  const [existing] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, OWNER_USERNAME));
  if (!existing) throw new Error("Unable to initialize owner credential");
  return existing;
}

export async function getAdminAccount(username: string) {
  const requested = username.trim();
  if (!requested || requested === OWNER_USERNAME || requested === "owner") return { role: "owner" as const, account: await ensureAdminCredential() };
  const [account] = await db.select().from(adminAssistants).where(eq(adminAssistants.username, requested));
  return account ? { role: "assistant" as const, account } : null;
}

export async function verifyAdminPassword(password: string, username = OWNER_USERNAME) {
  const found = await getAdminAccount(username);
  if (!found || (found.role === "assistant" && !found.account.active)) return false;
  if (found.role === "owner" && password === DEFAULT_ADMIN_PASSWORD && !verifyPassword(password, found.account.passwordHash)) {
    await db.update(adminCredentials).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(adminCredentials.id, found.account.id));
    return true;
  }
  return verifyPassword(password, found.account.passwordHash);
}

export function mustChangeAdminPassword(found: Awaited<ReturnType<typeof getAdminAccount>>) {
  return !!found && found.role === "owner" && verifyPassword(DEFAULT_ADMIN_PASSWORD, found.account.passwordHash);
}

export async function adminTokenFor(found: Awaited<ReturnType<typeof getAdminAccount>>) {
  if (!found) throw new Error("Unknown admin account");
  const account = found.account;
  const stamp = found.role === "owner" ? account.passwordChangedAt.toISOString() : account.updatedAt.toISOString();
  const signature = createHmac("sha256", sessionSecret()).update(`${TOKEN_VERSION}:${found.role}:${account.id}:${account.sessionVersion}:${stamp}`).digest("base64url");
  return `${TOKEN_VERSION}.${found.role}.${account.id}.${account.sessionVersion}.${signature}`;
}
export async function adminToken() { return adminTokenFor({ role: "owner", account: await ensureAdminCredential() }); }

export async function adminBoundaryAllowed() {
  if ((process.env.APP_MODE || "combined").toLowerCase() === "customer") return false;
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0].trim().toLowerCase();
  const identity = (h.get("cf-access-authenticated-user-email") || h.get("x-admin-email") || "").toLowerCase();
  const hosts = csv("ADMIN_ALLOWED_HOSTS"); const ips = csv("ADMIN_ALLOWED_IPS"); const emails = csv("ADMIN_ZERO_TRUST_EMAILS");
  if (hosts.length && !hosts.includes(host)) return false;
  if (ips.length && !ips.includes(ip)) return false;
  if (emails.length && !emails.includes(identity)) return false;
  return true;
}

export async function currentAdmin(): Promise<AdminIdentity | null> {
  if (!(await adminBoundaryAllowed())) return null;
  const supplied = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [version, role, idText, versionText, signature] = supplied.split(".");
  if (version !== TOKEN_VERSION || !["owner", "assistant"].includes(role) || !idText || !versionText || !signature) return null;
  const id = Number(idText); const sessionVersion = Number(versionText);
  const found = role === "owner" ? { role: "owner" as const, account: await ensureAdminCredential() } : await (async () => { const [a] = await db.select().from(adminAssistants).where(eq(adminAssistants.id, id)); return a ? { role: "assistant" as const, account: a } : null; })();
  if (!found || found.account.id !== id || found.account.sessionVersion !== sessionVersion || (found.role === "assistant" && !found.account.active)) return null;
  const token = await adminTokenFor(found);
  if (!safeEqual(supplied, token)) return null;
  return { role: found.role, id, username: found.account.username, mustChangePassword: mustChangeAdminPassword(found), permissions: found.role === "owner" ? ["products", "orders", "maintenance", "content", "reports", "security"] : ((found.account.permissions || []) as AdminPermission[]) };
}

export async function requireAdmin(permission?: AdminPermission) {
  const identity = await currentAdmin();
  return !!identity && (identity.role === "owner" || !permission || identity.permissions.includes(permission));
}

export async function changeAdminPassword(currentPassword: string, nextPassword: string) {
  const credential = await ensureAdminCredential();
  if (!verifyPassword(currentPassword, credential.passwordHash)) return { ok: false as const, error: "كلمة المرور الحالية غير صحيحة" };
  if (!isCredentialText(nextPassword, CREDENTIAL_MINIMUM, CREDENTIAL_MAXIMUM)) return { ok: false as const, error: `كلمة المرور الجديدة يجب أن تكون ${CREDENTIAL_MINIMUM} خانات على الأقل، وتقبل الحروف واللغات والأرقام والرموز، دون محارف تحكم` };
  if (safeEqual(currentPassword, nextPassword)) return { ok: false as const, error: "كلمة المرور الجديدة يجب أن تختلف عن الحالية" };
  await db.update(adminCredentials).set({ passwordHash: hashPassword(nextPassword), sessionVersion: sql`${adminCredentials.sessionVersion} + 1`, passwordChangedAt: new Date(), updatedAt: new Date() }).where(eq(adminCredentials.id, credential.id));
  return { ok: true as const };
}
export async function revokeAdminSessions() { const credential = await ensureAdminCredential(); await db.update(adminCredentials).set({ sessionVersion: sql`${adminCredentials.sessionVersion} + 1`, updatedAt: new Date() }).where(eq(adminCredentials.id, credential.id)); }
export function authConfiguration() { const hostRestricted = csv("ADMIN_ALLOWED_HOSTS").length > 0; const networkRestricted = csv("ADMIN_ALLOWED_IPS").length > 0 || csv("ADMIN_ZERO_TRUST_EMAILS").length > 0; return { customPassword: !!process.env.ADMIN_PASSWORD, customSessionSecret: !!process.env.SESSION_SECRET, hostRestricted, networkRestricted, ownerMode: (process.env.APP_MODE || "combined").toLowerCase() !== "customer", productionReady: !!process.env.ADMIN_PASSWORD && !!process.env.SESSION_SECRET && hostRestricted && networkRestricted }; }
