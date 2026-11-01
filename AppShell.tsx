"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import PwaRegister from "@/components/PwaRegister";
import { BRAND, DEVELOPER } from "@/lib/brand";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ownerApp = pathname.startsWith("/admin");

  if (ownerApp) {
    return (
      <div className="min-h-screen bg-bg text-white">
        <PwaRegister />
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="pb-24 md:pb-10">{children}</main>
      <PwaRegister />
      <footer className="border-t border-white/5 bg-panel/60 py-8 text-center text-xs text-white/40">
        <p className="font-bold text-white/60">{BRAND.fullName} — {BRAND.city}</p>
        <p className="text-[11px] text-white/35">{BRAND.nameEn}</p>
        <p className="mt-1">المستودع الرئيسي: {BRAND.warehouse} · هاتف: {BRAND.phone} · واتساب: {BRAND.whatsapp}</p>
        <div className="mt-2 flex justify-center gap-3 text-[10.5px]">
          <a href="/install" className="font-bold text-gold2 hover:underline">📲 تثبيت تطبيق العملاء</a>
          <a href="/legal" className="text-white/45 hover:text-white">⚖️ الشروط والخصوصية</a>
          <a href="/about" className="text-white/45 hover:text-white">ℹ️ عن النظام</a>
        </div>
        <p className="mt-2 text-white/30">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
        <div className="mx-auto mt-5 max-w-xl border-t border-white/8 px-4 pt-4">
          <p className="text-[11px] font-bold text-gold2">💻 تطوير وملكية النظام: {DEVELOPER.company} — {DEVELOPER.country}، {DEVELOPER.city}</p>
          <p className="mt-1 text-[10.5px] text-white/45">
            {DEVELOPER.managerTitle}: {DEVELOPER.manager} ·{" "}
            <a href={`https://wa.me/${DEVELOPER.phoneIntl}`} target="_blank" rel="noreferrer" className="font-bold text-[#25D366] hover:underline">{DEVELOPER.phone}</a>
          </p>
          <p className="mt-1 text-[10px] text-white/30">{DEVELOPER.rightsNote} © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
