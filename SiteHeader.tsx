"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import type { UiCategory, UiService } from "@/lib/taxonomy";
import { MOBILE_ROUTES } from "@/lib/navigation";
import AnimatedLogo from "./AnimatedLogo";
import SideDrawer from "./SideDrawer";
import BrandMarquee from "./BrandMarquee";
import AiAssistant from "./AiAssistant";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState<UiCategory[]>([]);
  const [svcs, setSvcs] = useState<UiService[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [news, setNews] = useState<{ id: number; text: string; kind: string }[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  const [customer, setCustomer] = useState<{ fullName: string } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/news").then((r) => r.json()).catch(() => ({ news: [] })),
      fetch("/api/customer").then((r) => r.json()).catch(() => ({ customer: null })),
    ]).then(([newsData, customerData]) => {
      if (!alive) return;
      const list = (newsData.news ?? []).slice(0, 6);
      setNews(list);
      setCustomer(customerData.customer ?? null);
      const last = localStorage.getItem("lx_news_seen");
      setSeen(last === String(list[0]?.id ?? ""));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!menu || cats.length) return;
    let alive = true;
    Promise.all([
      fetch("/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
      fetch("/api/services").then((r) => r.json()).catch(() => ({ services: [] })),
    ]).then(([categoryData, serviceData]) => {
      if (!alive) return;
      const rows = (categoryData.categories ?? []).filter((x: { isActive: boolean }) => x.isActive);
      const main = rows
        .filter((x: { level: number }) => x.level === 1)
        .map((root: UiCategory) => ({
          ...root,
          specSchema: root.specSchema ?? [],
          aiInstructions: root.aiInstructions ?? "",
          subcategories: rows
            .filter((sub: { level: number; parentKey: string }) => sub.level === 2 && sub.parentKey === root.key)
            .map((sub: { key: string; nameAr: string }) => ({
              key: sub.key,
              nameAr: sub.nameAr,
              secondary: rows
                .filter((sec: { level: number; parentKey: string }) => sec.level === 3 && sec.parentKey === sub.key)
                .map((sec: { key: string; nameAr: string }) => ({ key: sec.key, nameAr: sec.nameAr })),
            })),
        }));
      setCats(main);
      setSvcs((serviceData.services ?? []).filter((x: { isActive: boolean }) => x.isActive));
    });
    return () => { alive = false; };
  }, [menu, cats.length]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  function openNotifications() {
    setBellOpen((value) => !value);
    localStorage.setItem("lx_news_seen", String(news[0]?.id ?? ""));
    setSeen(true);
  }

  const circle = "flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.05] text-white/85 transition hover:border-gold/40 hover:bg-white/10";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-bg/95 shadow-[0_6px_24px_-12px_rgba(0,0,0,.95)] backdrop-blur-xl">
        {/* اسم الشركة والشعار أعلى الصفحة في الوسط */}
        <div className="flex flex-col items-center px-3 pb-2 pt-2 text-center">
          <Link href="/" aria-label={BRAND.companyName} className="inline-flex justify-center">
            <AnimatedLogo />
          </Link>
          <span className="mt-0 rounded-md bg-gradient-to-l from-red-600 to-red-500 px-3 py-0.5 text-[9px] font-black text-white sm:text-[10px]">
            جديد • مستخدم مجدد • مستخدم نظيف • جاهز بدون صيانة
          </span>
        </div>

        {/* البحث والقائمة يميناً — الجرس والحساب يساراً */}
        <div dir="ltr" className="relative flex min-h-[84px] w-full items-center justify-between border-t border-white/5 px-2 py-2 sm:px-4 md:px-8">
          {/* أقصى اليسار: الإشعارات ثم الدخول */}
          <div className="flex items-center gap-1.5" dir="ltr">
            <div className="relative">
              <button onClick={openNotifications} aria-label="الإشعارات" className={circle}>
                🔔
                {!seen && news.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-bg bg-red-500" />}
              </button>
              {bellOpen && (
                <>
                  <button aria-label="إغلاق الإشعارات" className="fixed inset-0 z-40 cursor-default" onClick={() => setBellOpen(false)} />
                  <div className="fade-up absolute left-0 z-50 mt-2 w-[290px] overflow-hidden rounded-xl border border-white/12 bg-panel text-right shadow-2xl" dir="rtl">
                    <div className="border-b border-white/10 px-3 py-2 text-xs font-black text-gold2">🔔 آخر الأخبار والتنبيهات</div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {news.length === 0 && <div className="px-3 py-5 text-center text-xs text-white/40">لا توجد إشعارات</div>}
                      {news.map((item) => (
                        <div key={item.id} className="border-b border-white/5 px-3 py-2.5 text-[11.5px] leading-relaxed text-white/80">
                          <span className="ml-1">{item.kind === "alert" ? "⚠️" : item.kind === "offer" ? "🎁" : item.kind === "info" ? "ℹ️" : "📰"}</span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Link href={customer ? "/dashboard" : "/account"} aria-label={customer ? "حساب العميل" : "تسجيل الدخول"}
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold2 px-3 text-xs font-black text-bg shadow-lg">
              {customer ? customer.fullName.trim().charAt(0) : "دخول"}
            </Link>
          </div>

          {/* المنتصف: المساعد الذكي في مستوى الأزرار */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <AiAssistant placement="header" />
          </div>

          {/* أقصى اليمين: البحث ثم القائمة، والقائمة ملاصقة للحافة */}
          <div className="flex items-center gap-1.5" dir="ltr">
            <button onClick={() => setSearchOpen((value) => !value)} aria-label="البحث الذكي" className={circle}>🔍</button>
            <button onClick={() => setMenu(true)} aria-label="فتح القائمة" className={circle}>☰</button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="fade-up border-t border-white/10 bg-panel px-3 py-2.5 md:px-8">
            <div className="mx-auto flex max-w-[1600px] gap-2">
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم والنوع والحجم والسعر أو اكتب: جهز لي مغسلة بـ 80 ألف"
                className="flex-1 rounded-lg bg-bg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:ring-1 focus:ring-gold" />
              <button className="btn-gold rounded-lg px-5 text-sm">بحث</button>
              <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost rounded-lg px-3 text-sm font-bold">✕</button>
            </div>
          </form>
        )}
      </header>

      <BrandMarquee />
      <SideDrawer open={menu} onClose={() => setMenu(false)} categories={cats} services={svcs} />

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-panel/95 backdrop-blur-xl md:hidden">
        {MOBILE_ROUTES.map((route) => (
          <Link key={route.href} href={route.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${pathname === route.href ? "text-gold2" : "text-white/60"}`}>
            <span className="text-base">{route.icon}</span>{route.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
