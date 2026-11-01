import { db } from "@/db";
import { bundles, products, type Bundle, type Product } from "@/db/schema";
import { asc, count, eq, inArray } from "drizzle-orm";

/** Blueprint for each turnkey package sold as a single deal. */
const PLANS: {
  key: "small" | "medium" | "central" | "hotel" | "hospital" | "carpet";
  nameAr: string;
  capacityNote: string;
  discount: number;
  warranty: number;
  lines: { role: string; category: string; qty: number; minCap: number; condition?: "new" | "refurbished" | "used" | "ready" }[];
}[] = [
  {
    key: "small", nameAr: "باقة مغسلة ملابس صغيرة — جاهزة للتشغيل",
    capacityNote: "تكفي 80–120 كجم غسيل يومياً · مناسبة لمغسلة حي سكني",
    discount: 12, warranty: 12,
    lines: [
      { role: "غسالة رئيسية", category: "washers", qty: 1, minCap: 15 },
      { role: "نشافة", category: "dryers", qty: 1, minCap: 15 },
      { role: "مكبس كي", category: "presses", qty: 1, minCap: 8 },
      { role: "مولد بخار", category: "boilers", qty: 1, minCap: 10 },
    ],
  },
  {
    key: "medium", nameAr: "باقة مغسلة متوسطة — خط إنتاج متكامل",
    capacityNote: "تكفي 250–400 كجم غسيل يومياً · مناسبة للمغاسل التجارية",
    discount: 14, warranty: 12,
    lines: [
      { role: "غسالات", category: "washers", qty: 2, minCap: 24 },
      { role: "نشافات", category: "dryers", qty: 2, minCap: 24 },
      { role: "مكابس", category: "presses", qty: 2, minCap: 12 },
      { role: "غلاية بخار", category: "boilers", qty: 1, minCap: 24 },
      { role: "سير نقل", category: "belts", qty: 1, minCap: 4 },
    ],
  },
  {
    key: "central", nameAr: "باقة مغسلة مركزية — طاقة إنتاجية عالية",
    capacityNote: "تكفي 1000+ كجم غسيل يومياً · تخدم عدة فروع أو منشآت",
    discount: 16, warranty: 24,
    lines: [
      { role: "غسالات عالية السعة", category: "washers", qty: 3, minCap: 50 },
      { role: "نشافات صناعية", category: "dryers", qty: 3, minCap: 50 },
      { role: "مكابس وتشطيب", category: "presses", qty: 3, minCap: 20 },
      { role: "غلاية مركزية", category: "boilers", qty: 1, minCap: 50 },
      { role: "خط سيور نقل", category: "belts", qty: 2, minCap: 6 },
    ],
  },
  {
    key: "hotel", nameAr: "باقة مغسلة فندق — بياضات ومفروشات",
    capacityNote: "تخدم فندقاً حتى 150 غرفة · بياضات ومناشف ومفارش",
    discount: 15, warranty: 24,
    lines: [
      { role: "غسالات فنادق", category: "washers", qty: 2, minCap: 35 },
      { role: "نشافات", category: "dryers", qty: 2, minCap: 35 },
      { role: "مكابس بياضات", category: "presses", qty: 2, minCap: 20 },
      { role: "غلاية بخار", category: "boilers", qty: 1, minCap: 35 },
      { role: "سير نقل", category: "belts", qty: 1, minCap: 5 },
    ],
  },
  {
    key: "hospital", nameAr: "باقة مغسلة مستشفى — تعقيم طبي",
    capacityNote: "دورات تعقيم حرارية · مطابقة لاشتراطات المنشآت الصحية",
    discount: 15, warranty: 24,
    lines: [
      { role: "غسالات تعقيم", category: "washers", qty: 2, minCap: 35, condition: "new" },
      { role: "نشافات حرارية", category: "dryers", qty: 2, minCap: 35, condition: "new" },
      { role: "غلاية بخار طبي", category: "boilers", qty: 1, minCap: 50, condition: "new" },
      { role: "مكبس تشطيب", category: "presses", qty: 1, minCap: 20 },
    ],
  },
  {
    key: "carpet", nameAr: "باقة مغسلة سجاد وموكيت",
    capacityNote: "خط غسيل وعصر وتجفيف للسجاد · حتى 500 م²/يوم",
    discount: 13, warranty: 12,
    lines: [
      { role: "خط غسيل سجاد", category: "carpet", qty: 1, minCap: 35 },
      { role: "عصارة سجاد", category: "carpet", qty: 1, minCap: 50 },
      { role: "غلاية تجفيف", category: "boilers", qty: 1, minCap: 24 },
    ],
  },
];

/** Build the turnkey packages once, from real catalogue products. */
export async function seedBundlesIfEmpty() {
  const [{ value }] = await db.select({ value: count() }).from(bundles);
  if (Number(value) > 0) return false;

  const all = await db.select().from(products).where(eq(products.isActive, true));
  if (all.length === 0) return false;

  const rows: (typeof bundles.$inferInsert)[] = [];

  PLANS.forEach((plan, idx) => {
    const items: { productId: number; qty: number; role: string }[] = [];
    let list = 0;

    for (const line of plan.lines) {
      const pool = all
        .filter((p) => p.category === line.category && p.capacityKg >= line.minCap && !p.isSold)
        .filter((p) => (line.condition ? p.condition === line.condition : true))
        .sort((a, b) => b.price - a.price);
      const pick = pool[Math.min(idx, Math.max(0, pool.length - 1))] ?? pool[0];
      if (!pick) continue;
      items.push({ productId: pick.id, qty: line.qty, role: line.role });
      list += pick.price * line.qty;
    }
    if (items.length === 0) return;

    const bundlePrice = Math.round((list * (100 - plan.discount)) / 100 / 50) * 50;
    const cover = all.find((p) => p.id === items[0].productId);

    rows.push({
      nameAr: plan.nameAr,
      shopType: plan.key,
      description: `باقة متكاملة تشمل ${items.reduce((s, i) => s + i.qty, 0)} قطعة جاهزة للتركيب والتشغيل. ${plan.capacityNote}. تشمل النقل والتركيب الميداني والتدريب على التشغيل وضمان ${plan.warranty} شهر.`,
      imageUrl: cover?.imageUrl ?? "/images/washer-computer.jpg",
      videoUrl: cover?.videoUrl ?? "",
      itemsJson: items,
      listPrice: list,
      bundlePrice,
      capacityNote: plan.capacityNote,
      warrantyMonths: plan.warranty,
      sortOrder: idx + 1,
    });
  });

  if (rows.length) await db.insert(bundles).values(rows);
  return true;
}

export type BundleWithItems = Bundle & {
  items: { role: string; qty: number; product: Product | null }[];
  savings: number;
  savingsPct: number;
};

export async function getBundles(): Promise<BundleWithItems[]> {
  await seedBundlesIfEmpty();
  const rows = await db.select().from(bundles).where(eq(bundles.isActive, true)).orderBy(asc(bundles.sortOrder));
  const ids = [...new Set(rows.flatMap((b) => b.itemsJson.map((i) => i.productId)))];
  const prods = ids.length ? await db.select().from(products).where(inArray(products.id, ids as number[])) : [];
  const map = new Map(prods.map((p) => [p.id, p]));

  return rows.map((b) => {
    const savings = b.listPrice - b.bundlePrice;
    return {
      ...b,
      items: b.itemsJson.map((i) => ({ role: i.role, qty: i.qty, product: map.get(i.productId) ?? null })),
      savings,
      savingsPct: b.listPrice ? Math.round((savings / b.listPrice) * 100) : 0,
    };
  });
}
