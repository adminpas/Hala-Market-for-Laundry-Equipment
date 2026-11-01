import type { PublicProduct } from "@/lib/data";

/* ------------------------------------------------------------------ *
 *  SMART SEARCH ENGINE
 *  1) Natural-language query parsing (Arabic) → structured filters
 *  2) Relevance ranking
 *  3) Budget-based shop outfitting ("جهّز لي مغسلة بـ 80 ألف")
 * ------------------------------------------------------------------ */

export type ParsedQuery = {
  text: string;
  keywords: string[];
  category?: string;
  subcategory?: string;
  secondaryCategory?: string;
  condition?: "new" | "refurbished" | "used" | "ready";
  origin?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  minCapacity?: number;
  guarantee?: number;
  sort?: "cheap" | "expensive" | "quality" | "relevance";
  budget?: number;
  shopType?: "small" | "medium" | "central" | "hotel" | "hospital" | "carpet";
};

const AR_DIGITS: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };

export function normalizeSearchText(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => AR_DIGITS[d] ?? d)
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .toLowerCase().trim();
}

/** Turn "٢٠ الف" / "20000" / "20 ألف ريال" into a number. */
function parseMoney(text: string): number | undefined {
  const t = normalizeSearchText(text);
  const mil = t.match(/(\d+(?:\.\d+)?)\s*(?:مليون)/);
  if (mil) return Math.round(parseFloat(mil[1]) * 1_000_000);
  const k = t.match(/(\d+(?:\.\d+)?)\s*(?:الف|ألف|k)/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const plain = t.match(/(\d{3,9})\s*(?:ريال|ر\.?س|sar)?/);
  if (plain) return parseInt(plain[1], 10);
  return undefined;
}

const CATEGORY_WORDS: Record<string, string[]> = {
  washers: ["غساله", "غسالات", "washer", "غسيل ملابس"],
  dryers: ["نشافه", "نشافات", "مجفف", "dryer", "تجفيف"],
  carpet: ["سجاد", "موكيت", "carpet", "عصاره سجاد"],
  presses: ["مكبس", "مكابس", "كي", "مكواه", "press", "مانجل"],
  boilers: ["غلايه", "غلايات", "مرجل", "مراجل", "بخار", "boiler"],
  belts: ["سير", "سيور", "ناقل", "belt", "conveyor"],
};

const ORIGIN_WORDS: Record<string, string[]> = {
  italy: ["ايطالي", "ايطاليا", "italy"],
  usa: ["امريكي", "امريكا", "usa", "american"],
  germany: ["الماني", "المانيا", "german"],
  turkey: ["تركي", "تركيا", "turkish"],
  china: ["صيني", "الصين", "china"],
};

const SHOP_WORDS: Record<NonNullable<ParsedQuery["shopType"]>, string[]> = {
  small: ["صغير", "صغيره", "بسيط", "مبتدئ", "حي"],
  medium: ["متوسط", "متوسطه", "عادي"],
  central: ["مركزي", "مركزيه", "كبير", "ضخم", "مصنع"],
  hotel: ["فندق", "فنادق", "منتجع", "شاليه"],
  hospital: ["مستشفي", "مستشفيات", "مصحه", "طبي", "تعقيم"],
  carpet: ["سجاد", "موكيت"],
};

/** Parse a free-text Arabic query into structured search filters. */
export function parseQuery(raw: string): ParsedQuery {
  const t = normalizeSearchText(raw);
  const out: ParsedQuery = { text: raw.trim(), keywords: [] };

  // intent: outfitting a shop with a budget
  const wantsShop = /(جهز|تجهيز|افتح|فتح|انشاء|مشروع|محل|مغسله كامله|باقه|ميزانيتي|بميزانيه|راس مال|راسمال)/.test(t);
  const money = parseMoney(t);
  // "مغسلة فندق بميزانية 250 ألف" → planning intent even without the verb
  const shopWithBudget = /مغسله|مغسلة/.test(t) && /(ميزانيه|ميزانية|بمبلغ|راس مال|بحدود|ب\s*\d)/.test(t);
  if ((wantsShop || shopWithBudget) && money) out.budget = money;

  for (const [k, words] of Object.entries(SHOP_WORDS)) {
    if (words.some((w) => t.includes(w))) { out.shopType = k as ParsedQuery["shopType"]; break; }
  }

  // price range
  const between = t.match(/(?:بين|من)\s*(\d+(?:\.\d+)?\s*(?:الف)?)\s*(?:الي|إلى|و|-)\s*(\d+(?:\.\d+)?\s*(?:الف)?)/);
  if (between) {
    out.minPrice = parseMoney(between[1]);
    out.maxPrice = parseMoney(between[2]);
  } else if (/(اقل من|تحت|حتي|لا يزيد|ميزانيتي|بحدود|في حدود)/.test(t) && money && !out.budget) {
    out.maxPrice = money;
  } else if (/(اكثر من|فوق|اغلي من)/.test(t) && money) {
    out.minPrice = money;
  }

  // sorting intent
  if (/(ارخص|اقل سعر|رخيص|اقتصادي)/.test(t)) out.sort = "cheap";
  else if (/(اغلي|اعلي سعر|افخم)/.test(t)) out.sort = "expensive";
  else if (/(افضل|اجود|جوده|قوي|متين|ممتاز)/.test(t)) out.sort = "quality";

  // condition
  if (/(جديد|كرت|new)/.test(t)) out.condition = "new";
  else if (/(مجدد|معاد|refurb)/.test(t)) out.condition = "refurbished";
  // "جاهزة للتشغيل / بدون صيانة" is its own grade, check before the generic "used"
  else if (/(جاهز للتشغيل|جاهزه للتشغيل|جاهز بدون صيانه|جاهزه بدون صيانه|بدون صيانه|بدون تجديد|تشغيل مباشر)/.test(t)) out.condition = "ready";
  else if (/(مستخدم|مستعمل|نظيف|used)/.test(t)) out.condition = "used";

  // category
  for (const [k, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => t.includes(normalizeSearchText(w)))) { out.category = k; break; }
  }

  // origin
  for (const [k, words] of Object.entries(ORIGIN_WORDS)) {
    if (words.some((w) => t.includes(w))) { out.origin = k; break; }
  }

  // capacity / size
  const cap = t.match(/(\d{1,3})\s*(?:كجم|كيلو|kg|متر|بوصه)/);
  if (cap) out.capacity = parseInt(cap[1], 10);
  if (/(كبير|ضخم|عملاق)/.test(t) && !out.capacity) out.minCapacity = 50;

  // guarantee
  const g = t.match(/ضمان\s*(\d{1,2})/);
  if (g) out.guarantee = parseInt(g[1], 10);
  if (/سنتين/.test(t)) out.guarantee = 24;
  else if (/سنه|سنة/.test(t) && !out.guarantee) out.guarantee = 12;

  out.keywords = t.split(/\s+/).filter((w) => w.length > 2 && !/^\d+$/.test(w));
  return out;
}

/** Score a product against the parsed query (higher = more relevant). */
function score(p: PublicProduct, q: ParsedQuery) {
  let s = 0;
  const hay = normalizeSearchText(`${p.nameAr} ${p.nameEn} ${p.brand} ${p.subcategoryAr} ${p.secondaryCategoryAr} ${p.originAr} ${p.description} ${JSON.stringify(p.customAttributes ?? {})}`);
  for (const k of q.keywords) if (hay.includes(k)) s += 10;
  if (q.category && p.category === q.category) s += 25;
  if (q.subcategory && p.subcategory === q.subcategory) s += 30;
  if (q.secondaryCategory && p.secondaryCategory === q.secondaryCategory) s += 35;
  if (q.condition && p.condition === q.condition) s += 15;
  if (q.origin && p.origin === q.origin) s += 15;
  if (q.capacity && p.capacityKg === q.capacity) s += 20;
  if (q.minCapacity && p.capacityKg >= q.minCapacity) s += 10;
  if (q.guarantee && p.guaranteeMonths >= q.guarantee) s += 8;
  if (q.maxPrice && p.price <= q.maxPrice) s += 12;
  if (q.minPrice && p.price >= q.minPrice) s += 6;
  if (p.isSpotlight) s += 3;
  if (p.isSold) s -= 100;
  if (p.reserved) s -= 20;
  return s;
}

export function smartSearch(products: PublicProduct[], q: ParsedQuery): PublicProduct[] {
  let list = products.filter((p) => {
    if (q.category && p.category !== q.category) return false;
    if (q.subcategory && p.subcategory !== q.subcategory) return false;
    if (q.secondaryCategory && p.secondaryCategory !== q.secondaryCategory) return false;
    if (q.condition && p.condition !== q.condition) return false;
    if (q.origin && p.origin !== q.origin) return false;
    if (q.capacity && p.capacityKg !== q.capacity) return false;
    if (q.minCapacity && p.capacityKg < q.minCapacity) return false;
    if (q.guarantee && p.guaranteeMonths < q.guarantee) return false;
    if (q.minPrice && p.price < q.minPrice) return false;
    if (q.maxPrice && p.price > q.maxPrice) return false;
    return true;
  });

  if (q.keywords.length) {
    const strict = list.filter((p) => score(p, q) > 0);
    if (strict.length) list = strict;
  }

  if (q.sort === "cheap") list.sort((a, b) => a.price - b.price);
  else if (q.sort === "expensive") list.sort((a, b) => b.price - a.price);
  else if (q.sort === "quality") {
    list.sort((a, b) => b.guaranteeMonths - a.guaranteeMonths || b.price - a.price);
  } else list.sort((a, b) => score(b, q) - score(a, q));

  return list;
}

/* ---------------- budget-based shop outfitting ---------------- */

export type ShopPlanLine = { role: string; product: PublicProduct; qty: number; subtotal: number };
export type ShopPlan = {
  shopType: string;
  budget: number;
  lines: ShopPlanLine[];
  total: number;
  remaining: number;
  notes: string[];
  feasible: boolean;
};

/** Equipment blueprint per shop type: category + share of budget + priority. */
const BLUEPRINT: Record<string, { role: string; category: string; share: number; qty: number; minCap?: number }[]> = {
  small: [
    { role: "غسالة رئيسية", category: "washers", share: 0.40, qty: 1, minCap: 15 },
    { role: "نشافة", category: "dryers", share: 0.30, qty: 1, minCap: 15 },
    { role: "مكبس كي", category: "presses", share: 0.20, qty: 1 },
    { role: "مولد بخار", category: "boilers", share: 0.10, qty: 1 },
  ],
  medium: [
    { role: "غسالات", category: "washers", share: 0.35, qty: 2, minCap: 24 },
    { role: "نشافات", category: "dryers", share: 0.25, qty: 2, minCap: 24 },
    { role: "مكابس", category: "presses", share: 0.18, qty: 2 },
    { role: "غلاية بخار", category: "boilers", share: 0.17, qty: 1 },
    { role: "سير نقل", category: "belts", share: 0.05, qty: 1 },
  ],
  central: [
    { role: "غسالات عالية السعة", category: "washers", share: 0.34, qty: 3, minCap: 50 },
    { role: "نشافات صناعية", category: "dryers", share: 0.24, qty: 3, minCap: 50 },
    { role: "مكابس وتشطيب", category: "presses", share: 0.16, qty: 3 },
    { role: "غلاية مركزية", category: "boilers", share: 0.16, qty: 1 },
    { role: "خط سيور نقل", category: "belts", share: 0.10, qty: 2 },
  ],
  hotel: [
    { role: "غسالات فنادق", category: "washers", share: 0.36, qty: 2, minCap: 35 },
    { role: "نشافات", category: "dryers", share: 0.25, qty: 2, minCap: 35 },
    { role: "مكابس بياضات", category: "presses", share: 0.20, qty: 2 },
    { role: "غلاية بخار", category: "boilers", share: 0.14, qty: 1 },
    { role: "سير نقل", category: "belts", share: 0.05, qty: 1 },
  ],
  hospital: [
    { role: "غسالات تعقيم", category: "washers", share: 0.40, qty: 2, minCap: 35 },
    { role: "نشافات حرارية", category: "dryers", share: 0.28, qty: 2, minCap: 35 },
    { role: "غلاية بخار طبي", category: "boilers", share: 0.22, qty: 1 },
    { role: "مكبس تشطيب", category: "presses", share: 0.10, qty: 1 },
  ],
  carpet: [
    { role: "خط غسيل سجاد", category: "carpet", share: 0.55, qty: 1 },
    { role: "عصارة سجاد", category: "carpet", share: 0.25, qty: 1 },
    { role: "غلاية / تجفيف", category: "boilers", share: 0.20, qty: 1 },
  ],
};

const SHOP_LABEL: Record<string, string> = {
  small: "مغسلة صغيرة (حي سكني)",
  medium: "مغسلة متوسطة",
  central: "مغسلة مركزية",
  hotel: "مغسلة فندق",
  hospital: "مغسلة مستشفى",
  carpet: "مغسلة سجاد",
};

/** Build the best equipment package that fits the customer's budget. */
export function planShop(
  products: PublicProduct[],
  budget: number,
  shopType: keyof typeof BLUEPRINT = "small",
  preferCondition?: "new" | "refurbished" | "used" | "ready",
): ShopPlan {
  const blueprint = BLUEPRINT[shopType] ?? BLUEPRINT.small;
  const available = products.filter((p) => !p.isSold && !p.reserved);
  const lines: ShopPlanLine[] = [];
  const notes: string[] = [];
  let spent = 0;

  for (const item of blueprint) {
    const allowance = budget * item.share;
    const perUnit = allowance / item.qty;

    const pool = available.filter(
      (p) => p.category === item.category && (!item.minCap || p.capacityKg >= item.minCap),
    );
    if (pool.length === 0) { notes.push(`لا تتوفر حالياً معدات في «${item.role}»`); continue; }

    // prefer the requested condition, then the best unit that fits the allowance
    const tryPools = preferCondition
      ? [pool.filter((p) => p.condition === preferCondition), pool]
      : [pool.filter((p) => p.condition === "new"), pool.filter((p) => p.condition === "ready"), pool.filter((p) => p.condition === "refurbished"), pool];

    let chosen: PublicProduct | undefined;
    for (const tp of tryPools) {
      const fit = tp.filter((p) => p.price <= perUnit).sort((a, b) => b.price - a.price)[0];
      if (fit) { chosen = fit; break; }
    }
    // nothing fits → take the cheapest available so the plan stays complete
    if (!chosen) {
      chosen = pool.sort((a, b) => a.price - b.price)[0];
      notes.push(`«${item.role}»: اخترنا الأنسب سعراً لتجاوز الميزانية المخصصة لهذا البند`);
    }

    const subtotal = chosen.price * item.qty;
    lines.push({ role: item.role, product: chosen, qty: item.qty, subtotal });
    spent += subtotal;
  }

  // ---- second pass: invest the leftover budget in better units ----
  let leftover = budget - spent;
  if (leftover > budget * 0.12) {
    for (const line of lines) {
      const bp = blueprint.find((b) => b.role === line.role);
      if (!bp) continue;
      const pool = available.filter(
        (p) => p.category === bp.category && (!bp.minCap || p.capacityKg >= bp.minCap) && p.id !== line.product.id,
      );
      // best upgrade that the leftover can still afford across all units
      const upgrade = pool
        .filter((p) => p.price > line.product.price && (p.price - line.product.price) * line.qty <= leftover)
        .sort((a, b) => b.price - a.price)[0];
      if (upgrade) {
        const delta = (upgrade.price - line.product.price) * line.qty;
        leftover -= delta;
        spent += delta;
        line.product = upgrade;
        line.subtotal = upgrade.price * line.qty;
      }
      if (leftover <= budget * 0.08) break;
    }
  }

  // ---- third pass: budget still large → add extra units (real capacity growth) ----
  let spare = budget - spent;
  if (spare > budget * 0.25 && lines.length) {
    // Grow the line that is furthest BELOW its blueprint ratio, so the
    // laundry stays balanced (washers ↔ dryers ↔ presses) instead of
    // piling up one machine type.
    let guard = 0;
    const baseQty = new Map(lines.map((l) => [l.role, blueprint.find((b) => b.role === l.role)?.qty ?? 1]));
    while (spare > budget * 0.12 && guard < 20) {
      guard++;
      const candidates = lines
        .filter((l) => l.product.price <= spare)
        .sort((a, b) => {
          const ra = a.qty / (baseQty.get(a.role) || 1);
          const rb = b.qty / (baseQty.get(b.role) || 1);
          return ra - rb; // the most "under-supplied" line first
        });
      const target = candidates[0];
      if (!target) break;
      target.qty += 1;
      target.subtotal = target.product.price * target.qty;
      spent += target.product.price;
      spare -= target.product.price;
    }
    notes.push("ميزانيتك تسمح بطاقة إنتاجية أعلى — وزّعنا الزيادة على الوحدات بشكل متوازن");
  }

  const remaining = budget - spent;
  if (remaining < 0) {
    notes.push(`الباقة تتجاوز ميزانيتك بـ ${Math.abs(remaining).toLocaleString("en-US")} ر.س — جرّب حالة «مستخدم مجدد» لخفض التكلفة ~40%`);
  } else if (remaining > budget * 0.15) {
    notes.push(`يتبقى ${remaining.toLocaleString("en-US")} ر.س بعد تجهيز الباقة الكاملة — يمكن تخصيصه للشحن والتركيب وقطع الغيار الاحتياطية أو توسعة مستقبلية`);
  }
  notes.push("الأسعار لا تشمل الشحن والتركيب والضريبة — تُحسب عند الطلب حسب موقعك");

  return {
    shopType: SHOP_LABEL[shopType] ?? shopType,
    budget, lines, total: spent, remaining,
    notes, feasible: spent <= budget,
  };
}

export const SHOP_TYPES = Object.keys(BLUEPRINT).map((k) => ({ key: k, label: SHOP_LABEL[k] }));
