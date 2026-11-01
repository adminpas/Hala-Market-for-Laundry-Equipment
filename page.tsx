import Link from "next/link";
import { BRAND, DEVELOPER } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "عن النظام وحقوق الملكية",
  description: "معلومات المنصة وحقوق ملكية النظام وبيانات الجهة المطوّرة.",
};

const MODULES = [
  { i: "🛒", t: "المتجر والأقسام", d: "عرض المعدات بأقسام رئيسية وفرعية وثانوية قابلة للتوسع" },
  { i: "🔎", t: "البحث الذكي", d: "بحث بالاسم والنوع والحجم والجودة والسعر بلغة طبيعية" },
  { i: "🧮", t: "تجهيز المغاسل بالميزانية", d: "بناء باقة متكاملة تلقائياً ضمن رأس مال العميل" },
  { i: "📦", t: "العروض المتكاملة", d: "باقات جاهزة تشمل النقل والتركيب والتدريب والضمان" },
  { i: "🔨", t: "مزاد التمكين", d: "عروض سرّية بسعر التكلفة بدون فوائد ربوية" },
  { i: "📉", t: "التصفية اليومية", d: "خفض السعر تلقائياً يومياً لتصريف المخزون الراكد" },
  { i: "🌍", t: "الطلبات والاستيراد", d: "تأمين أي معدة من داخل المملكة أو الخليج أو عالمياً" },
  { i: "🧭", t: "مستشار المشروع", d: "دراسة جدوى ومتابعة ما بعد التركيب والاستدامة" },
  { i: "🛠️", t: "مركز الصيانة", d: "طلبات ميدانية وورشية مع تتبع الفني" },
  { i: "🛡️", t: "مركز الأمن", d: "حماية من الاختراق والاحتيال والروابط الوهمية" },
  { i: "🧠", t: "النواة الذكية", d: "إشراف مركزي على كل وحدات الذكاء في النظام" },
  { i: "🎛️", t: "لوحة التحكم", d: "إدارة كاملة بلا برمجة: أقسام، خدمات، وسائط، مدفوعات" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">ABOUT & OWNERSHIP</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">ℹ️ عن النظام وحقوق الملكية</h1>
      </div>

      {/* platform owner */}
      <div className="panel mt-5 rounded-2xl p-5">
        <h2 className="font-black text-gold2">🏢 مالك المنصة التجارية</h2>
        <div className="mt-2 space-y-1 text-[12.5px] text-white/80">
          <p className="text-base font-black text-white">{BRAND.companyName}</p>
          <p className="text-[11px] text-white/45">{BRAND.nameEn}</p>
          <p>📍 {BRAND.city} — {BRAND.warehouse ?? "المنطقة الصناعية الثالثة، جدة"}</p>
          <p>📞 {BRAND.phone} · 💬 واتساب {BRAND.whatsapp}</p>
          <p className="text-[11px] text-white/50">الرقم الضريبي: {BRAND.vatNumber} · السجل التجاري: {BRAND.crNumber}</p>
        </div>
      </div>

      {/* system developer & IP owner */}
      <div className="panel mt-4 rounded-2xl border border-gold/30 p-5">
        <h2 className="font-black text-gold2">💻 الجهة المطوّرة ومالك حقوق النظام</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold2 text-2xl font-black text-bg">
            هلا
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black text-white">{DEVELOPER.company}</p>
            <p className="text-[11px] text-white/50">{DEVELOPER.companyEn}</p>
            <p className="mt-1 text-[12.5px] text-white/75">📍 {DEVELOPER.country} — {DEVELOPER.city}</p>
            <p className="text-[12.5px] text-white/75">
              👤 {DEVELOPER.managerTitle}: <b className="text-white">{DEVELOPER.manager}</b>
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href={`https://wa.me/${DEVELOPER.phoneIntl}`} target="_blank" rel="noreferrer"
            className="rounded-xl bg-[#25D366]/15 py-3 text-center text-sm font-black text-[#25D366] hover:bg-[#25D366]/25">
            💬 واتساب {DEVELOPER.phone}
          </a>
          <a href={`tel:+${DEVELOPER.phoneIntl}`}
            className="btn-ghost rounded-xl py-3 text-center text-sm font-bold">📞 اتصال مباشر</a>
        </div>

        <div className="mt-4 rounded-xl border border-gold/25 bg-gold/8 p-3">
          <p className="text-[11.5px] font-black text-gold2">⚖️ حقوق الملكية الفكرية</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/70">
            {DEVELOPER.rightsNote} — {DEVELOPER.country}، {DEVELOPER.city}. جميع الأكواد والخوارزميات ووحدات الذكاء
            الاصطناعي وتصميم الواجهات وبنية قاعدة البيانات مملوكة للجهة المطوّرة. لا يجوز نسخ النظام أو إعادة بيعه
            أو اشتقاق أنظمة منه دون إذن خطي مسبق.
          </p>
          <p className="mt-2 text-[10.5px] text-white/45">
            © {new Date().getFullYear()} {DEVELOPER.company} · جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* modules */}
      <div className="panel mt-4 rounded-2xl p-5">
        <h2 className="font-black text-gold2">⚡ وحدات النظام ({MODULES.length})</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.t} className="rounded-xl bg-bg p-3">
              <div className="text-[12.5px] font-black">{m.i} {m.t}</div>
              <div className="mt-0.5 text-[10.5px] leading-snug text-white/55">{m.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-gold rounded-xl px-5 py-3 text-sm">🏠 العودة للمنصة</Link>
        <Link href="/guide" className="btn-ghost rounded-xl px-5 py-3 text-sm font-bold">📋 دليل الاستخدام</Link>
      </div>
    </div>
  );
}
