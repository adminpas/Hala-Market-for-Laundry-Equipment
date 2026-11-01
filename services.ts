/** Client-safe: animated icon bar entries (main sections + company services). */
export const SERVICE_ICONS: {
  key: string;
  label: string;
  icon: string;
  href: string;
  color: string;
  kind: "section" | "service";
}[] = [
  { key: "washers", label: "غسالات", icon: "🫧", href: "/#washers", color: "#3b82f6", kind: "section" },
  { key: "dryers", label: "نشافات", icon: "🔥", href: "/#dryers", color: "#f97316", kind: "section" },
  { key: "carpet", label: "خطوط السجاد", icon: "🧶", href: "/#carpet", color: "#a855f7", kind: "section" },
  { key: "presses", label: "المكابس", icon: "♨️", href: "/#presses", color: "#ec4899", kind: "section" },
  { key: "boilers", label: "الغلايات", icon: "🔧", href: "/#boilers", color: "#ef4444", kind: "section" },
  { key: "advisor", label: "مستشار المشروع", icon: "🧭", href: "/advisor", color: "#8b5cf6", kind: "service" },
  { key: "clearance", label: "تصفية يومية", icon: "📉", href: "/clearance", color: "#dc2626", kind: "service" },
  { key: "auction", label: "المزاد الحصري", icon: "🔨", href: "/auctions", color: "#f43f5e", kind: "service" },
  { key: "special", label: "طلب واستيراد", icon: "🌍", href: "/special", color: "#06b6d4", kind: "service" },
  { key: "bundles", label: "عروض متكاملة", icon: "📦", href: "/bundles", color: "#ec4899", kind: "service" },
  { key: "smart-search", label: "تجهيز مغسلة", icon: "🧮", href: "/search", color: "#f59e0b", kind: "service" },
  { key: "maintenance", label: "صيانة فنية", icon: "🛠️", href: "/maintenance", color: "#10b981", kind: "service" },
  { key: "field", label: "تركيب ميداني", icon: "🚛", href: "/maintenance", color: "#06b6d4", kind: "service" },
  { key: "booking", label: "حجز 24 ساعة", icon: "⏳", href: "/dashboard", color: "#eab308", kind: "service" },
  { key: "invoices", label: "فواتيري", icon: "🧾", href: "/dashboard", color: "#8b5cf6", kind: "service" },
  { key: "spare", label: "قطع غيار", icon: "⚙️", href: "/maintenance", color: "#64748b", kind: "service" },
  { key: "training", label: "تدريب وتشغيل", icon: "🎓", href: "/maintenance", color: "#14b8a6", kind: "service" },
  { key: "whatsapp", label: "تواصل معنا", icon: "💬", href: "/maintenance", color: "#25D366", kind: "service" },
];
