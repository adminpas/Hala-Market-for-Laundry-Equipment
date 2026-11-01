import { db } from "@/db";
import {
  products,
  bookings,
  orders,
  maintenanceRequests,
  technicians,
  type Product,
} from "@/db/schema";
import { and, count, desc, eq, lt, sql } from "drizzle-orm";
import { seedIfEmpty } from "@/db/seed";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  try {
    await seedIfEmpty();
  } catch (e) {
    console.error("seed failed", e);
  }
  seeded = true;
}

/** Release expired 24h temporary reservations. */
export async function expireReservations() {
  const now = new Date();
  await db
    .update(products)
    .set({ reservedUntil: null, reservedByPhone: null })
    .where(and(sql`${products.reservedUntil} is not null`, lt(products.reservedUntil, now)));
  await db
    .update(bookings)
    .set({ status: "expired" })
    .where(and(eq(bookings.status, "active"), eq(bookings.type, "temporary"), lt(bookings.expiresAt, now)));
}

export type PublicProduct = Omit<Product, "reservedByPhone"> & {
  reserved: boolean;
  reservedUntilIso: string | null;
};

export function toPublic(p: Product): PublicProduct {
  const { reservedByPhone: _omit, ...rest } = p;
  void _omit;
  const reserved = !!p.reservedUntil && new Date(p.reservedUntil).getTime() > Date.now();
  return { ...rest, reserved, reservedUntilIso: reserved ? new Date(p.reservedUntil!).toISOString() : null };
}

export async function getAllProducts(): Promise<PublicProduct[]> {
  await ensureSeeded();
  await expireReservations();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.isSpotlight), products.id);
  return rows.map(toPublic);
}

/**
 * Curated subset for the storefront home page.
 * Sending all 2000+ rows inflates the HTML/RSC payload to ~5MB which breaks
 * slow mobile connections and proxy timeouts. Rows only need a handful each.
 */
export async function getShowcaseProducts(perSubcategory = 6): Promise<PublicProduct[]> {
  await ensureSeeded();
  await expireReservations();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.isSpotlight), products.id);

  const seen = new Map<string, number>();
  const out: Product[] = [];
  for (const r of rows) {
    const key = `${r.subcategory}:${r.condition}`;
    const n = seen.get(key) ?? 0;
    if (n >= perSubcategory) continue;
    seen.set(key, n + 1);
    out.push(r);
  }
  // trim long text from list payload (full text is fetched on demand in the modal)
  return out.map((r) => {
    const p = toPublic(r);
    return { ...p, description: p.description.slice(0, 90), features: p.features.slice(0, 3) };
  });
}

/** Products of a single main-category or subcategory (DB-filtered). */
export async function getSectionProducts(key: string, level: 1 | 2 | 3): Promise<PublicProduct[]> {
  await ensureSeeded();
  await expireReservations();
  const sectionFilter = level === 1
    ? eq(products.category, key)
    : level === 2
      ? eq(products.subcategory, key)
      : eq(products.secondaryCategory, key);
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), sectionFilter))
    .orderBy(desc(products.isSpotlight), products.id);
  return rows.map(toPublic);
}

export async function getProductById(id: number) {
  await expireReservations();
  const [row] = await db.select().from(products).where(eq(products.id, id));
  return row ?? null;
}

export async function getAdminOverview() {
  await ensureSeeded();
  await expireReservations();
  const [adminProducts, productCounts, allBookings, allOrders, allTickets, allTechs] = await Promise.all([
    // Keep the initial admin payload small enough to hydrate reliably on phones.
    db.select().from(products).orderBy(desc(products.id)).limit(120),
    db.select({
      total: count(),
      available: sql<number>`count(*) filter (where ${products.isActive} = true and ${products.isSold} = false)`,
    }).from(products),
    db
      .select({
        booking: bookings,
        productName: products.nameAr,
        productPrice: products.price,
      })
      .from(bookings)
      .leftJoin(products, eq(bookings.productId, products.id))
      .orderBy(desc(bookings.id)),
    db
      .select({ order: orders, productName: products.nameAr })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .orderBy(desc(orders.id)),
    db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.id)),
    db.select().from(technicians).orderBy(technicians.id),
  ]);
  const paidOrders = allOrders.filter((o) => o.order.paymentStatus === "paid");
  const delivered = paidOrders.filter((o) => o.order.status === "delivered" || o.order.status === "installed");
  const revenue = paidOrders.reduce((s, o) => s + o.order.depositAmount, 0);
  return {
    products: adminProducts,
    bookings: allBookings,
    orders: allOrders,
    tickets: allTickets,
    technicians: allTechs,
    stats: {
      revenue,
      ordersCount: paidOrders.length,
      deliveryRate: paidOrders.length ? Math.round((delivered.length / paidOrders.length) * 100) : 0,
      activeBookings: allBookings.filter((b) => b.booking.status === "active").length,
      openTickets: allTickets.filter((t) => t.status !== "done").length,
      productsCount: Number(productCounts[0]?.available ?? 0),
      totalProducts: Number(productCounts[0]?.total ?? 0),
    },
  };
}
