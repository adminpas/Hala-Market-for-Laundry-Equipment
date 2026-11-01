export type PlatformRoute = {
  href: string;
  label: string;
  icon: string;
  description: string;
  header?: boolean;
  mobile?: boolean;
  ownerOnly?: boolean;
};

/** المصدر المركزي الوحيد لصفحات النظام داخل الرابط الرئيسي نفسه. */
export const PLATFORM_ROUTES: PlatformRoute[] = [
  { href: "/", label: "الرئيسية", icon: "🎬", description: "العروض والأقسام", header: true, mobile: true },
  { href: "/market", label: "المتجر", icon: "▦", description: "جميع المعدات", header: true, mobile: true },
  { href: "/search", label: "البحث الذكي", icon: "🔎", description: "بحث وتجهيز بالميزانية", header: true },
  { href: "/bundles", label: "العروض المتكاملة", icon: "📦", description: "مغسلة جاهزة", header: true },
  { href: "/auctions", label: "مزاد التمكين", icon: "🔨", description: "عروض سرية بسعر التكلفة" },
  { href: "/advisor", label: "مستشار المشروع", icon: "🧭", description: "جدوى واستدامة" },
  { href: "/clearance", label: "التصفية", icon: "📉", description: "السعر ينخفض يومياً" },
  { href: "/special", label: "طلب واستيراد", icon: "🌍", description: "معدات غير متوفرة" },
  { href: "/maintenance", label: "الصيانة", icon: "🛠️", description: "ميدانية وورشة", mobile: true },
  { href: "/cart", label: "السلة", icon: "🛒", description: "الشراء والحجز", mobile: true },
  { href: "/dashboard", label: "طلباتي وفواتيري", icon: "🧾", description: "لوحة العميل" },
  { href: "/verify", label: "بطاقة المعدة", icon: "🛡️", description: "التحقق من سجل المعدة" },
  { href: "/install", label: "تثبيت التطبيق", icon: "📲", description: "كل الأنظمة" },
  { href: "/guide", label: "دليل التجربة", icon: "📋", description: "اختبار خطوة بخطوة" },
  { href: "/legal", label: "الشروط والخصوصية", icon: "⚖️", description: "الملف القانوني" },
  { href: "/about", label: "عن النظام", icon: "ℹ️", description: "الملكية والتواصل" },
  { href: "/admin", label: "لوحة إدارة النظام", icon: "🎛️", description: "الإدارة من نفس المنصة", ownerOnly: true },
  { href: "/admin/install", label: "تثبيت تطبيق المدير", icon: "📲", description: "نسخة مصغرة للمالك", ownerOnly: true },
  { href: "/system", label: "الفحص الشامل", icon: "🧪", description: "التدقيق والجاهزية", ownerOnly: true },
];

export const PUBLIC_ROUTES = PLATFORM_ROUTES.filter((route) => !route.ownerOnly);
export const OWNER_ROUTES = PLATFORM_ROUTES;
export const HEADER_ROUTES = PUBLIC_ROUTES.filter((route) => route.header);
export const MOBILE_ROUTES = PUBLIC_ROUTES.filter((route) => route.mobile).slice(0, 4);
