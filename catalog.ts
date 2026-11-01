import type { CategoryKey, ConditionKey } from "@/db/schema";

export const WAREHOUSE = {
  name: "مستودع الشركة الرئيسي - جدة",
  address: "المنطقة الصناعية الثالثة، جدة، المملكة العربية السعودية",
  lat: 21.4225,
  lng: 39.2262,
};

export const CATEGORIES: {
  key: CategoryKey;
  nameAr: string;
  nameEn: string;
  icon: string;
  subcategories: { key: string; nameAr: string }[];
}[] = [
  {
    key: "washers",
    nameAr: "غسالات",
    nameEn: "Washers",
    icon: "🫧",
    subcategories: [
      { key: "computer", nameAr: "غسالات كمبيوتر" },
      { key: "hotel", nameAr: "غسالات فنادق (Heavy Duty)" },
      { key: "ordinary", nameAr: "غسالات عادية" },
      { key: "household", nameAr: "غسالات منزلية ضخمة" },
    ],
  },
  {
    key: "dryers",
    nameAr: "نشافات",
    nameEn: "Dryers",
    icon: "🔥",
    subcategories: [
      { key: "gas", nameAr: "نشافات غاز" },
      { key: "electric", nameAr: "نشافات كهرباء" },
      { key: "steam", nameAr: "نشافات بخار" },
    ],
  },
  {
    key: "carpet",
    nameAr: "خطوط السجاد",
    nameEn: "Carpet Line",
    icon: "🧶",
    subcategories: [
      { key: "auto-line", nameAr: "خط غسيل أوتوماتيك" },
      { key: "centrifuge", nameAr: "عصارات سجاد" },
      { key: "dust", nameAr: "نافضات غبار" },
    ],
  },
  {
    key: "presses",
    nameAr: "المكابس",
    nameEn: "Presses",
    icon: "♨️",
    subcategories: [
      { key: "press-steam", nameAr: "مكابس بخار" },
      { key: "press-shirt", nameAr: "مكابس قمصان" },
      { key: "press-trouser", nameAr: "مكابس بناطيل" },
      { key: "press-roller", nameAr: "مكابس أسطوانية (مانجل)" },
      { key: "press-finishing", nameAr: "معدات تشطيب وتنفيخ" },
    ],
  },
  {
    key: "belts",
    nameAr: "السيور المتحركة",
    nameEn: "Conveyor Belts",
    icon: "⛓️",
    subcategories: [
      { key: "belt-conveyor", nameAr: "سيور نقل الغسيل" },
      { key: "belt-sorting", nameAr: "سيور الفرز" },
      { key: "belt-feeding", nameAr: "سيور التغذية للمكواة" },
      { key: "belt-motor", nameAr: "محركات وطارات السيور" },
    ],
  },
  {
    key: "boilers",
    nameAr: "المراجل والغلايات",
    nameEn: "Boilers",
    icon: "🔧",
    subcategories: [
      { key: "boiler-vertical", nameAr: "غلايات عمودية" },
      { key: "boiler-horizontal", nameAr: "غلايات أفقية" },
      { key: "boiler-electric", nameAr: "غلايات كهربائية" },
      { key: "boiler-diesel", nameAr: "غلايات ديزل" },
      { key: "boiler-gas", nameAr: "غلايات غاز" },
      { key: "boiler-generator", nameAr: "مولدات بخار فورية" },
    ],
  },
];

export const ORIGINS = [
  { key: "italy", nameAr: "إيطالي" },
  { key: "usa", nameAr: "أمريكي" },
  { key: "germany", nameAr: "ألماني" },
  { key: "turkey", nameAr: "تركي" },
  { key: "china", nameAr: "صيني" },
];

export const CAPACITIES = [10, 15, 24, 35, 50, 80, 120];
export const GUARANTEES = [
  { months: 6, nameAr: "6 أشهر" },
  { months: 12, nameAr: "سنة" },
  { months: 24, nameAr: "سنتان" },
];

export const CONDITION_LABEL: Record<ConditionKey, string> = {
  new: "جديد كرت",
  refurbished: "مستخدم مجدد",
  used: "مستخدم نظيف",
  ready: "مستخدم جاهز بدون صيانة",
};

/** Short badge + colour for each condition. */
export const CONDITION_META: Record<ConditionKey, { short: string; color: string; bg: string }> = {
  new: { short: "جديد", color: "#ffffff", bg: "#dc2626" },
  refurbished: { short: "مجدد", color: "#ffffff", bg: "#0ea5e9" },
  used: { short: "نظيف", color: "#07090d", bg: "#10b981" },
  ready: { short: "جاهز", color: "#07090d", bg: "#a855f7" },
};

export const CONDITIONS: ConditionKey[] = ["new", "refurbished", "used", "ready"];

export const SAUDI_CITIES: { name: string; km: number }[] = [
  { name: "جدة", km: 18 },
  { name: "مكة المكرمة", km: 82 },
  { name: "الطائف", km: 172 },
  { name: "رابغ", km: 150 },
  { name: "ينبع", km: 340 },
  { name: "المدينة المنورة", km: 420 },
  { name: "الباحة", km: 380 },
  { name: "أبها", km: 640 },
  { name: "جازان", km: 710 },
  { name: "تبوك", km: 1030 },
  { name: "الرياض", km: 950 },
  { name: "القصيم", km: 870 },
  { name: "حائل", km: 900 },
  { name: "الدمام", km: 1350 },
  { name: "الأحساء", km: 1400 },
];

export const VAT_RATE = 0.15;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Logistics calculator: shipping + field installation fees based on
 * kilometre distance from the Jeddah warehouse and machine weight.
 */
export function calculateLogistics(distanceKm: number, weightKg: number, price: number) {
  const km = Math.max(0, Math.round(distanceKm));
  // Shipping: base handling + per-km rate that decreases for long haul + weight surcharge
  const perKm = km <= 100 ? 4.5 : km <= 500 ? 3.2 : 2.4;
  const weightSurcharge = Math.ceil(weightKg / 100) * 45;
  const shippingFee = Math.round(180 + km * perKm + weightSurcharge);
  // Installation: field team base + travel allowance beyond 60km
  const travelAllowance = km > 60 ? Math.round((km - 60) * 1.8) : 0;
  const installationFee = Math.round(450 + Math.ceil(weightKg / 250) * 150 + travelAllowance);
  const subtotal = price;
  const vat = Math.round((subtotal + shippingFee + installationFee) * VAT_RATE);
  const total = subtotal + shippingFee + installationFee + vat;
  return { km, shippingFee, installationFee, subtotal, vat, total };
}

/** Capacity wording differs per category (kg load, steam kg/h, press inches). */
export function capacityLabel(cat: string, v: number) {
  if (cat === "boilers") return `${v * 10} كجم بخار/ساعة`;
  if (cat === "presses") return `${v} بوصة`;
  if (cat === "belts") return `${v} متر طول`;
  return `${v} كجم`;
}

/** Short badge version used on poster cards. */
export function capacityBadge(cat: string, v: number) {
  if (cat === "boilers") return `${v * 10} كجم/س`;
  if (cat === "presses") return `${v}"`;
  if (cat === "belts") return `${v} م`;
  return `${v} كجم`;
}

/**
 * Deterministic poster variation so repeated base photos never look identical:
 * each product gets its own hue/contrast/brightness and framing.
 */
export function posterFx(id: number) {
  const hue = ((id * 37) % 40) - 20; // -20..19 deg
  const sat = 0.9 + ((id * 13) % 30) / 100; // 0.90..1.19
  const bright = 0.86 + ((id * 29) % 26) / 100; // 0.86..1.11
  const contrast = 0.95 + (((id * 17) % 10) + (id % 18)) / 100;
  const flip = id % 3 === 0;
  const zoom = 1 + ((id * 11) % 12) / 100; // 1.00..1.11
  const shiftX = ((id * 23) % 14) - 7;
  const shiftY = ((id * 19) % 10) - 5;
  return {
    filter: `hue-rotate(${hue}deg) saturate(${sat}) brightness(${bright}) contrast(${contrast})`,
    transform: `scale(${zoom}) translate(${shiftX}px, ${shiftY}px)${flip ? " scaleX(-1)" : ""}`,
  } as const;
}

export function formatSAR(n: number) {
  return `${n.toLocaleString("en-US")} ر.س`;
}

export function isReserved(p: { reservedUntil: Date | string | null }) {
  if (!p.reservedUntil) return false;
  return new Date(p.reservedUntil).getTime() > Date.now();
}
