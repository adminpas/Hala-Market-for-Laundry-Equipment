import { db } from "@/db";
import { products, technicians, type NewProduct, type CategoryKey } from "@/db/schema";
import { count } from "drizzle-orm";
import { CATEGORIES, ORIGINS, capacityLabel } from "@/lib/catalog";
import { mediaFor } from "@/lib/media";

/** How many pieces to generate per subcategory, per condition. */
export const PER_SUB_PER_CONDITION = 50;

const CONDITION_LIST = ["new", "refurbished", "used", "ready"] as const;

const BRANDS: Record<string, string[]> = {
  italy: ["IMESA", "Grandimpianti", "Renzacci", "Firbimatic", "Union", "Battistella", "Trevil", "Ghidini", "Pony", "Lavatec"],
  usa: ["UniMac", "Speed Queen", "Milnor", "Continental Girbau", "Huebsch", "Fulton", "American Dryer", "Chicago Dryer"],
  germany: ["Miele Professional", "Kannegiesser", "Veit", "Bosch Industrial", "Certuss", "Herbert", "Electrolux Pro"],
  turkey: ["Tolkar", "Domus TR", "Ozdilek", "Uzman Kazan", "Ermak", "Makinesan", "Asya Kazan"],
  china: ["Sea-Lion", "Flying Fish", "Lijing", "Taifeng", "Goldfist", "Hualian", "Oasis"],
};

const BASE_PRICE: Record<CategoryKey, number> = {
  washers: 1400, dryers: 1100, carpet: 2600, presses: 900, boilers: 1500, belts: 1200,
};

/** Distinct descriptive variants so every piece has its own identity. */
const VARIANT: Record<string, string[]> = {
  computer: ["بلوحة لمس", "إنفرتر موفر", "برامج ذكية", "شاشة ملونة", "تحكم عن بعد"],
  hotel: ["تعليق مرن", "هيكل مقوّى", "عصر فائق", "خدمة شاقة", "حلة مزدوجة"],
  ordinary: ["اقتصادية", "مفاتيح ميكانيكية", "تشغيل بسيط", "صيانة سهلة", "موفرة للماء"],
  household: ["سعة ضخمة", "هادئة التشغيل", "بخار مدمج", "تعقيم حراري", "باب واسع"],
  gas: ["حارق أوتوماتيك", "توفير غاز", "إشعال إلكتروني", "أمان مزدوج"],
  electric: ["سخانات ستانلس", "ترموستات رقمي", "عزل حراري", "كفاءة عالية"],
  steam: ["ملفات بخار", "تجفيف لطيف", "تحكم بالرطوبة", "سرعة عالية"],
  "auto-line": ["خط متكامل", "سير أوتوماتيك", "فرش مزدوجة", "شطف متعدد"],
  centrifuge: ["عصر سريع", "اتزان ذاتي", "حلة كبيرة", "توفير وقت"],
  dust: ["نفض عميق", "شفط قوي", "فلتر مزدوج", "تشغيل هادئ"],
  "press-steam": ["سطح تيفلون", "بخار مباشر", "ذراع هوائي", "شفط وتنفيخ"],
  "press-shirt": ["قالب أكمام", "فرد تلقائي", "بخار جانبي", "إنتاجية عالية"],
  "press-trouser": ["قالب طولي", "كبس مزدوج", "شد أوتوماتيك", "تشطيب ممتاز"],
  "press-roller": ["أسطوانة حرارية", "تغذية أوتوماتيك", "عرض واسع", "طي مدمج"],
  "press-finishing": ["تنفيخ هوائي", "منفاخ حراري", "قالب قابل للتعديل", "تشطيب نهائي"],
  "boiler-vertical": ["عمودية مدمجة", "توفير مساحة", "ضغط ثابت", "عزل صخري"],
  "boiler-horizontal": ["أفقية صناعية", "أنابيب لهب", "سعة كبيرة", "كفاءة احتراق"],
  "boiler-electric": ["سخانات متدرجة", "تشغيل صامت", "بدون مداخن", "تحكم دقيق"],
  "boiler-diesel": ["حارق ديزل", "استهلاك منخفض", "إشعال تلقائي", "خزان مدمج"],
  "boiler-gas": ["حارق غاز", "صديقة للبيئة", "توفير تشغيل", "أمان أوروبي"],
  "boiler-generator": ["بخار فوري", "تسخين سريع", "مدمجة الحجم", "ضغط عالي"],
  "belt-conveyor": ["نقل مستمر", "سرعة متغيرة", "عرض واسع", "هيكل مقوّى"],
  "belt-sorting": ["فرز أوتوماتيك", "مسارات متعددة", "حساسات ذكية", "تحكم رقمي"],
  "belt-feeding": ["تغذية دقيقة", "تزامن مع المكواة", "فرد تلقائي", "إنتاجية عالية"],
  "belt-motor": ["محرك تروس", "عزم عالي", "توفير طاقة", "تشغيل صامت"],
};

const FEATURES: Record<CategoryKey, string[]> = {
  washers: ["محرك إنفرتر موفر للطاقة", "لوحة تحكم رقمية بـ 30 برنامج", "حلة ستانلس ستيل 304", "عصر عالي السرعة G-Force 350", "نظام تعليق مرن Soft Mount", "توصيل أوتوماتيكي للمنظفات", "غطاء أمان مزدوج", "هيكل مقاوم للصدأ"],
  dryers: ["تدفق هواء محوري لتجفيف أسرع", "حساس رطوبة أوتوماتيكي", "عكس دوران الحلة لمنع التشابك", "فلتر وبر سهل التنظيف", "لوحة تحكم ميكروبروسيسور", "استهلاك منخفض للطاقة"],
  carpet: ["فرش دوارة مزدوجة", "سير ناقل ستانلس ستيل", "تحكم في سرعة الغسيل", "خزان مياه مع تدوير", "عصارة سجاد مدمجة", "طاقة إنتاجية حتى 500 م²/ساعة"],
  presses: ["سطح كبس تيفلون مقاوم للالتصاق", "تحكم إلكتروني بدرجة الحرارة", "شفط وتنفيخ مدمج", "ذراع تشغيل بضغط الهواء", "صمامات أمان أوروبية", "هيكل فولاذي متين", "توفير في استهلاك البخار"],
  belts: ["سير مقاوم للحرارة والرطوبة", "هيكل ستانلس ستيل 304", "محرك تروس بسرعة متغيرة", "لوحة تحكم بسرعة السير", "حساسات أمان لإيقاف فوري", "بكرات مطاطية مانعة للانزلاق", "قابل للتمديد والوصل", "صيانة سهلة وقطع متوفرة"],
  boilers: ["وعاء ضغط مطابق لمواصفة ASME", "عزل حراري صخري عالي الكفاءة", "لوحة تحكم أوتوماتيكية بالضغط", "صمام أمان مزدوج معاير", "مضخة تغذية مياه أوتوماتيكية", "حارق أوروبي عالي الكفاءة", "نظام أمان ضد الاحتراق الجاف", "كفاءة احتراق تتجاوز 90%"],
};

const CAPACITY_SET: Record<CategoryKey, number[]> = {
  washers: [10, 15, 20, 24, 30, 35, 50, 70, 80, 100, 120],
  dryers: [15, 20, 24, 30, 35, 50, 60, 80],
  carpet: [35, 50, 60, 80, 100, 120],
  presses: [8, 10, 12, 15, 20, 24, 30, 35],
  boilers: [10, 15, 20, 24, 30, 35, 50, 60, 80, 100, 120],
  belts: [3, 4, 5, 6, 8, 10, 12, 15],
};

function pick<T>(a: T[], i: number): T { return a[i % a.length]; }

function buildProducts(): NewProduct[] {
  const list: NewProduct[] = [];
  const originKeys = ORIGINS.map((o) => o.key);

  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      // unique, stable, collision-free code per subcategory (e.g. press-shirt -> PRE-SHI)
      const subCode = sub.key
        .split("-")
        .map((part) => part.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))
        .filter(Boolean)
        .join("");
      for (const condition of CONDITION_LIST) {
        for (let i = 0; i < PER_SUB_PER_CONDITION; i++) {
          // spread attributes with co-prime steps so every piece differs
          const origin = ORIGINS[(i * 3 + (condition === "used" ? 1 : 0)) % originKeys.length];
          const brandList = BRANDS[origin.key];
          const brand = brandList[(i * 2) % brandList.length];
          const caps = CAPACITY_SET[cat.key];
          const capacity = caps[(i * 5 + 1) % caps.length];
          const guarantee = condition === "new" ? [12, 24][i % 2]
            : condition === "refurbished" ? [6, 12][i % 2]
            : condition === "ready" ? [6, 12][i % 2]
            : [3, 6][i % 2];
          const variants = VARIANT[sub.key] ?? ["قياسي"];
          const variant = variants[i % variants.length];

          const mult = origin.key === "italy" || origin.key === "germany" ? 1.6 : origin.key === "usa" ? 1.45 : origin.key === "turkey" ? 1.1 : 0.85;
          const base = BASE_PRICE[cat.key] * mult * (1 + capacity / 22);
          const priceNew = Math.round((base * (1 + ((i * 7) % 18) / 100)) / 50) * 50;
          const factor = condition === "new" ? 1
            : condition === "refurbished" ? 0.62 + (i % 5) * 0.02
            : condition === "ready" ? 0.55 + (i % 5) * 0.02
            : 0.48 + (i % 5) * 0.02;
          const price = Math.round((priceNew * factor) / 50) * 50;

          const weight = cat.key === "belts" ? Math.round(capacity * 38 + 80)
            : cat.key === "boilers" ? Math.round(capacity * 11 + 260)
            : cat.key === "carpet" ? Math.round(capacity * 22 + 120)
            : cat.key === "presses" ? Math.round(capacity * 9 + 120)
            : Math.round(capacity * 14 + 120);
          const dims = cat.key === "belts"
            ? `${capacity * 100} × ${60 + (i % 4) * 20} × ${85 + (i % 3) * 10} سم (طول × عرض × ارتفاع)`
            : cat.key === "boilers"
            ? `${Math.round(80 + capacity * 0.8)} × ${Math.round(90 + capacity * 0.9)} × ${Math.round(150 + capacity * 1.4)} سم`
            : `${Math.round(70 + capacity * 1.1)} × ${Math.round(80 + capacity * 1.3)} × ${Math.round(120 + capacity * 0.9)} سم`;
          const power = cat.key === "belts"
            ? `${(0.75 + (i % 6) * 0.55).toFixed(2)} كيلوواط · ${capacity >= 8 ? "380V ثلاثي الأطوار" : "220V أحادي الطور"} · سرعة متغيرة`
            : cat.key === "boilers"
            ? sub.key === "boiler-electric" ? `${Math.round(capacity * 1.2)} كيلوواط · 380V ثلاثي الأطوار`
              : sub.key === "boiler-diesel" ? `حارق ديزل · ~${(capacity * 0.9).toFixed(1)} لتر/ساعة · 220V تحكم`
              : sub.key === "boiler-gas" ? "حارق غاز طبيعي/LPG · 220V تحكم"
              : "380V ثلاثي الأطوار - 50Hz"
            : capacity >= 50 ? "380V ثلاثي الأطوار - 50Hz" : capacity >= 24 ? "380V/220V - 50Hz" : "220V أحادي الطور - 50Hz";

          const fx = FEATURES[cat.key];
          const features = [fx[i % fx.length], fx[(i + 2) % fx.length], fx[(i + 4) % fx.length], variant];
          if (cat.key === "boilers") features.push(`ضغط تشغيل ${(4 + (i % 5) * 0.5).toFixed(1)} بار`, `إنتاجية ${capacity * 10} كجم بخار/ساعة`);
          if (cat.key === "presses") features.push(`مقاس سطح الكبس ${capacity} بوصة`);
          if (cat.key === "belts") features.push(`طول السير ${capacity} متر`, `سرعة حتى ${(6 + (i % 5) * 3)} متر/دقيقة`, `حمولة حتى ${40 + (i % 6) * 15} كجم/متر`);
          if (condition === "refurbished") features.push("مجددة بالكامل في ورش الشركة بجدة", "قطع غيار جديدة وفحص شامل موثق بالفيديو");
          if (condition === "used") features.push("مستخدمة نظيفة بحالة ممتازة", "فحص فني وتشغيل تجريبي قبل التسليم");
          if (condition === "ready") features.push("جاهزة للتشغيل فوراً بدون أي صيانة", "ساعات تشغيل منخفضة وحالة فنية ممتازة", "تسليم وتركيب في نفس اليوم");

          const core = sub.nameAr.split(" (")[0];
          const sizeTxt = cat.key === "boilers" ? `${capacity * 10} كجم/ساعة`
          : cat.key === "presses" ? `${capacity} بوصة`
          : cat.key === "belts" ? `${capacity} متر`
          : `${capacity} كجم`;
          const nameAr = `${core} ${brand} ${sizeTxt} — ${variant}`;
          const model = `${brand.split(" ")[0].toUpperCase().slice(0, 4)}-${capacity}${condition === "new" ? "N" : condition === "refurbished" ? "R" : condition === "ready" ? "Y" : "U"}${String(i + 1).padStart(3, "0")}`;
          const { imageUrl, videoUrl } = mediaFor(sub.key, i);

          list.push({
            sku: `${subCode}-${condition === "new" ? "N" : condition === "refurbished" ? "R" : condition === "ready" ? "Y" : "U"}-${String(i + 1).padStart(3, "0")}`,
            nameAr,
            nameEn: `${brand} ${model}`,
            brand,
            category: cat.key,
            subcategory: sub.key,
            subcategoryAr: sub.nameAr,
            condition,
            origin: origin.key,
            originAr: origin.nameAr,
            capacityKg: capacity,
            guaranteeMonths: guarantee,
            price,
            oldPrice: condition !== "new" ? priceNew : i % 4 === 0 ? Math.round(price * 1.12) : null,
            imageUrl,
            videoUrl,
            description:
              condition === "new"
                ? `${core} من ${brand} ${origin.nameAr} الصنع (${variant}) بـ${capacityLabel(cat.key, capacity)}. جديدة بالكرتون مع ضمان ${guarantee} شهر، تركيب ميداني وتشغيل تجريبي من فريق شركة النجيب المتطورة في جدة.`
                : condition === "refurbished"
                  ? `${core} ${brand} ${origin.nameAr} (${variant}) بـ${capacityLabel(cat.key, capacity)}. مستخدمة ومجددة بالكامل في ورشنا بجدة بقطع غيار جديدة، مع فيديو تشغيل حي وضمان ${guarantee} شهر.`
                  : condition === "ready"
                    ? `${core} ${brand} ${origin.nameAr} (${variant}) بـ${capacityLabel(cat.key, capacity)}. مستخدمة بحالة ممتازة وجاهزة للتشغيل فوراً بدون أي صيانة أو تجديد، مع ضمان ${guarantee} شهر.`
                    : `${core} ${brand} ${origin.nameAr} (${variant}) بـ${capacityLabel(cat.key, capacity)}. مستخدمة نظيفة بحالة ممتازة، تم فحصها وتشغيلها تجريبياً، مع ضمان ${guarantee} شهر.`,
            features,
            dimensions: dims,
            weightKg: weight,
            power,
            isSpotlight: i === 0,
            isActive: true,
            isSold: false,
            customAttributes: {},
          });
        }
      }
    }
  }
  return list;
}

export async function seedIfEmpty() {
  const [{ value }] = await db.select({ value: count() }).from(products);
  if (Number(value) > 0) return false;
  const rows = buildProducts();
  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(products).values(rows.slice(i, i + 200));
  }
  await db.insert(technicians).values([
    { name: "م. خالد العمري", phone: "0551000001", specialty: "غسالات صناعية", status: "available", completedJobs: 212, rating: 4.9 },
    { name: "م. سامي الحربي", phone: "0551000002", specialty: "نشافات وغلايات", status: "available", completedJobs: 168, rating: 4.8 },
    { name: "م. يوسف الزهراني", phone: "0551000003", specialty: "خطوط السجاد", status: "available", completedJobs: 97, rating: 4.7 },
    { name: "م. فهد القحطاني", phone: "0551000004", specialty: "مكابس ولوحات تحكم", status: "available", completedJobs: 143, rating: 4.9 },
    { name: "م. ماجد الشهري", phone: "0551000005", specialty: "غلايات وأنظمة بخار", status: "available", completedJobs: 121, rating: 4.8 },
  ]);
  return true;
}
