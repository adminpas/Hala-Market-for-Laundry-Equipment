import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { customers, type Customer } from "@/db/schema";
import { eq } from "drizzle-orm";

export const CUSTOMER_COOKIE = "lx_cust";
const SESSION_VERSION = "v2";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(pw, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return test.length === orig.length && timingSafeEqual(test, orig);
}

function secret() {
  return process.env.SESSION_SECRET || "";
}

export function sessionToken(id: number, phone: string) {
  const signature = createHmac("sha256", secret())
    .update(`${SESSION_VERSION}:${id}:${phone}`)
    .digest("base64url");
  return `${SESSION_VERSION}.${id}.${signature}`;
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const raw = store.get(CUSTOMER_COOKIE)?.value ?? "";
  const [, idText] = raw.split(".");
  const id = Number(idText);
  if (!id) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer || !safeEqual(raw, sessionToken(customer.id, customer.phone))) return null;
  return customer;
}

export async function setCustomerSession(customer: Customer, request?: Request) {
  const store = await cookies();
  const secure = request
    ? new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"
    : process.env.NODE_ENV === "production";
  store.set(CUSTOMER_COOKIE, sessionToken(customer.id, customer.phone), {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export function publicCustomer(customer: Customer) {
  const { passwordHash: _password, ...rest } = customer;
  void _password;
  return rest;
}
