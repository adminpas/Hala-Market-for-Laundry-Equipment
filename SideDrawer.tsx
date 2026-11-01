"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UiCategory, UiService } from "@/lib/taxonomy";
import { BRAND, DEVELOPER } from "@/lib/brand";
import { PUBLIC_ROUTES } from "@/lib/navigation";

export default function SideDrawer({
  open, onClose, categories = [], services = [],
}: {
  open: boolean;
  onClose: () => void;
  categories?: UiCategory[];
  services?: UiService[];
}) {
  const pathname = usePathname();
  const CATEGORIES = categories;
  const SERVICE_ICONS = services;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="drawer-in absolute right-0 top-0 flex h-full w-[86%] max-w-[320px] flex-col overflow-y-auto border-l border-white/10 bg-panel"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold2 font-black text-bg">ن</span>
            <div className="leading-tight">
              <div className="text-sm font-black gold-gradient-text">النجيب المتطورة</div>
              <div className="text-[9px] text-white/45">{BRAND.tagline}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20">✕</button>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] font-bold text-white/40">القائمة الرئيسية</div>
          <nav className="mt-2 space-y-1">
            {PUBLIC_ROUTES.map((m) => {
              const active = pathname === m.href;
              return (
                <Link key={m.href} href={m.href} onClick={onClose}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                    active ? "border-r-2 border-gold bg-gold/12 text-gold2" : "text-white/75 hover:bg-white/5"
                  }`}>
                  <span>{m.label}</span>
                  <span className="text-base opacity-70">{m.icon}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4 pb-3">
          <div className="text-[10px] font-bold text-white/40">الأقسام</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Link key={c.key} href={`/#${c.key}`} onClick={onClose}
                className="rounded-full border border-white/12 bg-bg px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-gold/50 hover:text-white">
                {c.icon} {c.nameAr}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="text-[10px] font-bold text-white/40">الخدمات</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SERVICE_ICONS.filter((s) => s.kind === "service").map((s) => (
              <Link key={s.key} href={s.href} onClick={onClose}
                className="rounded-full border px-3 py-1.5 text-[11px] font-bold transition"
                style={{ borderColor: `${s.color}55`, color: s.color, background: `${s.color}10` }}>
                {s.icon} {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* golden promo card */}
        <div className="mx-4 mb-4 mt-auto rounded-xl border border-gold/35 bg-gradient-to-br from-gold/18 to-transparent p-4">
          <div className="text-sm font-black text-gold2">👑 خدمة العملاء الذهبية</div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/65">
            تركيب ميداني، ضمان حتى سنتين، وصيانة أولوية 24 ساعة لجميع مدن المملكة.
          </p>
          <a href={`https://wa.me/${BRAND.whatsappIntl}`} target="_blank" rel="noreferrer"
            className="mt-3 block rounded-lg bg-gradient-to-l from-gold to-gold2 py-2.5 text-center text-xs font-black text-bg">
            تواصل مع مستشار المبيعات
          </a>
        </div>

        {/* developer credit */}
        <div className="mx-4 mb-4 rounded-lg border border-white/8 bg-bg p-2.5 text-center">
          <p className="text-[9.5px] text-white/40">تطوير وملكية النظام</p>
          <p className="text-[11px] font-black text-gold2">{DEVELOPER.company} — {DEVELOPER.city}</p>
          <a href={`https://wa.me/${DEVELOPER.phoneIntl}`} target="_blank" rel="noreferrer"
            className="text-[10px] font-bold text-[#25D366]">{DEVELOPER.manager} · {DEVELOPER.phone}</a>
        </div>
      </aside>
    </div>
  );
}
