import { db } from "@/db";
import { ads, newsItems, type Ad, type NewsItem } from "@/db/schema";
import { and, asc, count, desc, eq, or, isNull, lte, gte, sql } from "drizzle-orm";

const DEFAULT_ADS = [
  {
    title: "مساحتك الإعلانية هنا",
    subtitle: "أعلن عن منتجاتك أمام آلاف أصحاب المغاسل في السعودية — احجز مساحتك الآن",
    advertiser: "إدارة المنصة",
    ctaLabel: "احجز مساحتك الإعلانية",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#241a06",
    bgTo: "#0f1115",
    accent: "#c5a059",
    badge: "مساحة متاحة",
    sortOrder: 1,
  },
  {
    title: "مواد تنظيف ومنظفات صناعية",
    subtitle: "منظفات مركزة للمغاسل بأسعار الجملة — توصيل لجميع مناطق المملكة",
    advertiser: "شركة الكيماويات المتحدة",
    ctaLabel: "اطلب عرض سعر",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#06231c",
    bgTo: "#0f1115",
    accent: "#10b981",
    badge: "إعلان",
    sortOrder: 2,
  },
  {
    title: "قطع غيار أصلية لجميع الماركات",
    subtitle: "مواتير، طلمبات، صمامات، وبلّي — متوفرة في مستودعنا بجدة",
    advertiser: "مؤسسة الرواد لقطع الغيار",
    ctaLabel: "تصفح القطع",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#1b0a22",
    bgTo: "#0f1115",
    accent: "#a855f7",
    badge: "إعلان",
    sortOrder: 3,
  },
  {
    title: "تمويل تأجيري لمعدات المغاسل",
    subtitle: "افتح مغسلتك بالتقسيط حتى 36 شهراً — موافقة سريعة ومتوافق مع الشريعة",
    advertiser: "شركة التمويل الميسر",
    ctaLabel: "احسب قسطك",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#0a1a2e",
    bgTo: "#0f1115",
    accent: "#3b82f6",
    badge: "إعلان ممول",
    sortOrder: 4,
  },
  {
    title: "أنظمة بخار وتوفير طاقة",
    subtitle: "حلول عزل وأنظمة استرجاع حرارة تخفض فاتورتك حتى 30%",
    advertiser: "الشركة السعودية للطاقة",
    ctaLabel: "اطلب دراسة مجانية",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#2a1204",
    bgTo: "#0f1115",
    accent: "#f97316",
    badge: "إعلان",
    sortOrder: 5,
  },
  {
    title: "تأمين ضد الحريق للمنشآت",
    subtitle: "غطّ مغسلتك ومعداتك بوثيقة تأمين شاملة بأقساط تبدأ من 99 ريال شهرياً",
    advertiser: "شركة الأمان للتأمين",
    ctaLabel: "احصل على عرض",
    linkUrl: "https://wa.me/966555000000",
    bgFrom: "#2a0810",
    bgTo: "#0f1115",
    accent: "#ef4444",
    badge: "إعلان",
    sortOrder: 6,
  },
];

const DEFAULT_NEWS = [
  { text: "وصول شحنة جديدة من الغلايات الإيطالية بجميع الأحجام إلى مستودع جدة", kind: "news" as const, pinned: true, sortOrder: 1 },
  { text: "خصم 10% على جميع المعدات المجددة حتى نهاية الشهر الجاري", kind: "offer" as const, pinned: false, sortOrder: 2 },
  { text: "تنبيه: خدمة الصيانة الميدانية متاحة الآن على مدار 24 ساعة في جدة ومكة", kind: "alert" as const, pinned: false, sortOrder: 3 },
  { text: "افتتاح ورشة الصيانة الجديدة في المنطقة الصناعية الثالثة بجدة", kind: "news" as const, pinned: false, sortOrder: 4 },
  { text: "الآن يمكنك حجز أي ماكينة مؤقتاً لمدة 24 ساعة قبل الشراء", kind: "info" as const, pinned: false, sortOrder: 5 },
  { text: "دورة تدريبية مجانية لأصحاب المغاسل على تشغيل خطوط السجاد", kind: "news" as const, pinned: false, sortOrder: 6 },
];

import { seedBundlesIfEmpty } from "@/lib/bundles";

export async function seedContentIfEmpty() {
  await seedBundlesIfEmpty().catch(() => {});
  const [{ value: adCount }] = await db.select({ value: count() }).from(ads);
  if (Number(adCount) === 0) await db.insert(ads).values(DEFAULT_ADS);
  const [{ value: newsCount }] = await db.select({ value: count() }).from(newsItems);
  if (Number(newsCount) === 0) await db.insert(newsItems).values(DEFAULT_NEWS);
}

/** Active ads within their scheduling window. */
export async function getActiveAds(): Promise<Ad[]> {
  const now = new Date();
  return db
    .select()
    .from(ads)
    .where(
      and(
        eq(ads.isActive, true),
        or(isNull(ads.startsAt), lte(ads.startsAt, now)),
        or(isNull(ads.endsAt), gte(ads.endsAt, now)),
      ),
    )
    .orderBy(asc(ads.sortOrder), asc(ads.id));
}

export async function getActiveNews(): Promise<NewsItem[]> {
  return db
    .select()
    .from(newsItems)
    .where(eq(newsItems.isActive, true))
    .orderBy(desc(newsItems.pinned), asc(newsItems.sortOrder), asc(newsItems.id));
}

export async function getAllAds() {
  return db.select().from(ads).orderBy(asc(ads.sortOrder), asc(ads.id));
}

export async function getAllNews() {
  return db.select().from(newsItems).orderBy(desc(newsItems.pinned), asc(newsItems.sortOrder), asc(newsItems.id));
}

export async function trackAd(id: number, type: "click" | "impression") {
  const col = type === "click" ? { clicks: sql`${ads.clicks} + 1` } : { impressions: sql`${ads.impressions} + 1` };
  await db.update(ads).set(col).where(eq(ads.id, id));
}
