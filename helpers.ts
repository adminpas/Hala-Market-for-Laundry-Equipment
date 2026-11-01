import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function insertReturningQuery(query: Promise<unknown>, table: any) {
  const result = await query as any;
  const id = Number(result?.insertId ?? result?.[0]?.insertId);
  if (!Number.isFinite(id) || id <= 0) return [];
  return db.select().from(table).where(eq(table.id, id));
}

export async function updateReturningQuery(query: Promise<unknown>, table: any, where: any) {
  await query;
  return db.select().from(table).where(where);
}
