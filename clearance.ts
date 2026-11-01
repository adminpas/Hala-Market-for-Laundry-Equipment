import { db } from "@/db";
import { clearanceDeals, products, type Product } from "@/db/schema";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ *
 *  CLEARANCE ENGINE (Dutch auction)
 *  Price falls automatically every day until the floor is reached.
 *  Creates urgency: "buy now, or risk someone else taking it".
 * ------------------------------------------------------------------ */

export type LiveDeal = {
  id: number;
  productId: number;
  product: Pick<Product, "id" | "nameAr" | "imageUrl" | "condition" | "originAr" | "capacityKg" | "category" | "guaranteeMonths" | "price" | "brand"> | null;
  startPrice: number;
  floorPrice: number;
  dropPerDay: number;
  currentPrice: number;
  nextPrice: number;
  daysRunning: number;
  daysLeft: number;
  discountPct: number;
  atFloor: boolean;
  reason: string;
  endsAt: string;
  watchers: number;
  status: string;
  soldPrice: number | null;
  soldTo: string;
};

/** Price today = start − (elapsed days × daily drop), never below floor. */
export function priceOn(deal: { startPrice: number; floorPrice: number; dropPerDay: number; startsAt: Date | string }, at = new Date()) {
  const start = new Date(deal.startsAt).getTime();
  const days = Math.max(0, Math.floor((at.getTime() - start) / 86_400_000));
  return { price: Math.max(deal.floorPrice, deal.startPrice - days * deal.dropPerDay), days };
}

/** Close deals whose window has expired. */
export async function expireClearance() {
  await db
    .update(clearanceDeals)
    .set({ status: "ended" })
    .where(and(eq(clearanceDeals.status, "live"), lt(clearanceDeals.endsAt, new Date())));
}

export async function getLiveDeals(includeEnded = false): Promise<LiveDeal[]> {
  await expireClearance();
  const rows = await db
    .select()
    .from(clearanceDeals)
    .where(includeEnded ? sql`1=1` : eq(clearanceDeals.status, "live"))
    .orderBy(desc(clearanceDeals.id));

  const ids = rows.map((r) => r.productId);
  const prods = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const map = new Map<number, Product>(prods.map((p: Product) => [p.id, p]));
  const now = new Date();

  return rows.map((d) => {
    const { price, days } = priceOn(d, now);
    const p = map.get(d.productId) ?? null;
    const daysLeft = Math.max(0, Math.ceil((new Date(d.endsAt).getTime() - now.getTime()) / 86_400_000));
    return {
      id: d.id,
      productId: d.productId,
      product: p && {
        id: p.id, nameAr: p.nameAr, imageUrl: p.imageUrl, condition: p.condition,
        originAr: p.originAr, capacityKg: p.capacityKg, category: p.category,
        guaranteeMonths: p.guaranteeMonths, price: p.price, brand: p.brand,
      },
      startPrice: d.startPrice,
      floorPrice: d.floorPrice,
      dropPerDay: d.dropPerDay,
      currentPrice: d.status === "sold" ? (d.soldPrice ?? price) : price,
      nextPrice: Math.max(d.floorPrice, price - d.dropPerDay),
      daysRunning: days,
      daysLeft,
      discountPct: d.startPrice ? Math.round(((d.startPrice - price) / d.startPrice) * 100) : 0,
      atFloor: price <= d.floorPrice,
      reason: d.reason,
      endsAt: new Date(d.endsAt).toISOString(),
      watchers: d.watchers,
      status: d.status,
      soldPrice: d.soldPrice,
      soldTo: d.soldTo,
    };
  });
}

/**
 * AI stock-age advisor: finds machines that have been sitting unsold and
 * proposes a clearance plan with a sensible floor and daily drop.
 */
export async function suggestClearance(limit = 12) {
  const existing = await db.select({ pid: clearanceDeals.productId }).from(clearanceDeals).where(eq(clearanceDeals.status, "live"));
  const busy = new Set(existing.map((e) => e.pid));

  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isSold, false)))
    .orderBy(products.createdAt)
    .limit(400);

  const now = Date.now();
  return rows
    .filter((p) => !busy.has(p.id))
    .map((p) => {
      const ageDays = Math.floor((now - new Date(p.createdAt).getTime()) / 86_400_000);
      // older + used stock gets a deeper suggested cut
      const base = p.condition === "new" ? 12 : p.condition === "refurbished" ? 20 : 28;
      const ageBonus = Math.min(20, Math.floor(ageDays / 30) * 4);
      const cutPct = base + ageBonus;
      const floor = Math.round((p.price * (100 - cutPct)) / 100 / 50) * 50;
      const drop = Math.max(50, Math.round((p.price - floor) / 30 / 50) * 50);
      return {
        product: { id: p.id, nameAr: p.nameAr, price: p.price, imageUrl: p.imageUrl, condition: p.condition, category: p.category },
        ageDays,
        suggestedFloor: floor,
        suggestedDrop: drop,
        cutPct,
        priority: ageDays * (p.condition === "new" ? 1 : 1.6),
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
