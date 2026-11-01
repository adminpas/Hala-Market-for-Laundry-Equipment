"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicProduct } from "@/lib/data";
import { CONDITION_LABEL, CONDITIONS, ORIGINS, capacityLabel, formatSAR } from "@/lib/catalog";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

type Line = { role: string; product: PublicProduct; qty: number; subtotal: number };
type Plan = { shopType: string; budget: number; lines: Line[]; total: number; remaining: number; notes: string[]; feasible: boolean };

const SHOPS = [
  { key: "small", label: "مغسلة صغيرة", icon: "🏠" },
  { key: "medium", label: "مغسلة متوسطة", icon: "🏢" },
  { key: "central", label: "مغسلة مركزية", icon: "🏭" },
  { key: "hotel", label: "مغسلة فندق", icon: "🏨" },
  { key: "hospital", label: "مغسلة مستشفى", icon: "🏥" },
  { key: "carpet", label: "مغسلة سجاد", icon: "🧶" },
];

const DEFAULT_CATS = [
  { key: "washers", label: "غسالات" }, { key: "dryers", label: "نشافات" },
  { key: "carpet", label: "خطوط السجاد" }, { key: "presses", label: "مكابس" },
  { key: "boilers", label: "مراجل وغلايات" }, { key: "belts", label: "سيور" },
];

const EXAMPLES = [
  "جهز لي مغسلة صغيرة بـ 80 ألف",
  "غسالة إيطالي 50 كجم أقل من 30000",
  "أرخص نشافة جديدة بضمان سنتين",
  "مغسلة فندق بميزانية 250 ألف",
  "أفضل غلاية ديزل جودة عالية",
];

function Inner() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [mode, setMode] = useState<"search" | "plan">("search");
  const [results, setResults] = useState<PublicProduct[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meta, setMeta] = useState<{ count: number; priceRange: { min: number; max: number } | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<PublicProduct | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATS);

  // filters
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [origin, setOrigin] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");

  // planner
  const [budget, setBudget] = useState(80000);
  const [shopType, setShopType] = useState("small");
  const [planCond, setPlanCond] = useState("");

  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => setFavorites(JSON.parse(localStorage.getItem("lx_favorites") || "[]")), 0);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const main = (d.categories ?? [])
          .filter((c: { level: number; isActive: boolean }) => c.level === 1 && c.isActive)
          .map((c: { key: string; nameAr: string }) => ({ key: c.key, label: c.nameAr }));
        if (main.length) setCategoryOptions(main);
      })
      .catch(() => {});
    return () => { alive = false; clearTimeout(id); };
  }, []);

  const onFav = useCallback((id: number) => {
    setFavorites((p) => {
      const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      localStorage.setItem("lx_favorites", JSON.stringify(n));
      return n;
    });
  }, []);

  const runSearch = useCallback(async (text?: string) => {
    setBusy(true); setPlan(null);
    const r = await fetch("/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text ?? q, category: category || undefined, condition: condition || undefined,
        origin: origin || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined,
        sort: sort === "relevance" ? undefined : sort,
      }),
    }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r) return;
    if (r.plan) { setPlan(r.plan); setResults([]); setMode("plan"); return; }
    setResults(r.results ?? []);
    setMeta({ count: r.count ?? 0, priceRange: r.priceRange ?? null });
  }, [q, category, condition, origin, minPrice, maxPrice, sort]);

  const runPlan = useCallback(async () => {
    setBusy(true); setResults([]);
    const r = await fetch("/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "plan", budget, shopType, condition: planCond || undefined }),
    }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.plan) setPlan(r.plan);
  }, [budget, shopType, planCond]);

  useEffect(() => {
    const initial = sp.get("q");
    if (initial) { const id = setTimeout(() => runSearch(initial), 0); return () => clearTimeout(id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chip = (a: boolean) => `chip rounded-full px-3 py-1.5 text-[11px] font-bold ${a ? "chip-active" : ""}`;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">AI SMART SEARCH</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">🔍 البحث الذكي وتجهيز المغاسل</h1>
        <p className="mt-1 text-sm text-white/60">اكتب طلبك بلغتك الطبيعية — أو حدّد ميزانيتك ونجهّز لك مغسلة كاملة.</p>
      </div>

      {/* mode switch */}
      <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 rounded-xl border border-white/10 bg-panel p-2">
        {([["search", "🔎 بحث عن معدة"], ["plan", "🧮 جهّز مغسلتي بميزانية"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`rounded-lg px-3 py-2.5 text-[12px] font-black transition sm:text-sm ${mode === k ? "btn-gold" : "bg-white/[0.04] text-white/65 hover:bg-white/10"}`}>{l}</button>
        ))}
      </div>

      {mode === "search" ? (
        <div className="panel mt-4 rounded-2xl p-4">
          <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: غسالة إيطالي 50 كجم أقل من 30000"
              className="input flex-1" />
            <button disabled={busy} className="btn-gold rounded-xl px-6 text-sm disabled:opacity-60">{busy ? "..." : "ابحث"}</button>
          </form>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => { setQ(ex); runSearch(ex); }} className="rounded-full border border-white/10 bg-bg px-2.5 py-1 text-[10px] text-white/55 hover:border-gold/40 hover:text-white">
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select className="input !py-2 text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">كل الأقسام</option>
              {categoryOptions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select className="input !py-2 text-xs" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">كل الحالات</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
            </select>
            <select className="input !py-2 text-xs" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option value="">كل المناشئ</option>
              {ORIGINS.map((o) => <option key={o.key} value={o.key}>{o.nameAr}</option>)}
            </select>
            <input className="input !py-2 text-xs" type="number" placeholder="أقل سعر" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <input className="input !py-2 text-xs" type="number" placeholder="أعلى سعر" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            <select className="input !py-2 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">الأنسب</option>
              <option value="cheap">الأرخص</option>
              <option value="expensive">الأغلى</option>
              <option value="quality">الأعلى جودة</option>
            </select>
          </div>
          <button onClick={() => runSearch()} className="btn-ghost mt-2 w-full rounded-xl py-2 text-xs font-bold">تطبيق الفلاتر</button>
        </div>
      ) : (
        <div className="panel mt-4 rounded-2xl p-4">
          <div className="text-xs font-black text-gold2">🏗️ نوع المشروع</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {SHOPS.map((s) => (
              <button key={s.key} onClick={() => setShopType(s.key)}
                className={`rounded-xl border p-3 text-center text-[11px] font-bold transition ${shopType === s.key ? "border-gold bg-gold/12 text-gold2" : "border-white/10 bg-bg text-white/65"}`}>
                <div className="text-xl">{s.icon}</div>{s.label}
              </button>
            ))}
          </div>

          <div className="mt-4 text-xs font-black text-gold2">💰 ميزانيتك: <span className="text-lg text-price">{formatSAR(budget)}</span></div>
          <input type="range" min={20000} max={1000000} step={5000} value={budget} onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-2 w-full accent-[#c5a059]" />
          <div className="flex justify-between text-[10px] text-white/40"><span>20,000</span><span>1,000,000</span></div>
          <input type="number" className="input mt-2" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} placeholder="أو اكتب المبلغ" />

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[11px] font-black text-gold2">تفضيل الحالة:</span>
            <button onClick={() => setPlanCond("")} className={chip(planCond === "")}>الأنسب تلقائياً</button>
            {CONDITIONS.map((c) => <button key={c} onClick={() => setPlanCond(c)} className={chip(planCond === c)}>{CONDITION_LABEL[c]}</button>)}
          </div>

          <button onClick={runPlan} disabled={busy} className="btn-gold mt-4 w-full rounded-xl py-3 disabled:opacity-60">
            {busy ? "⏳ جاري التجهيز..." : "🧮 جهّز لي القائمة الآن"}
          </button>
        </div>
      )}

      {/* ── plan result ── */}
      {plan && (
        <div className="fade-up panel mt-5 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">📋 باقة {plan.shopType}</h2>
            <span className={`rounded-lg px-3 py-1 text-xs font-black ${plan.feasible ? "bg-price/20 text-price" : "bg-amber-500/20 text-amber-300"}`}>
              {plan.feasible ? "✅ ضمن ميزانيتك" : "⚠️ تتجاوز الميزانية"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["الميزانية", plan.budget, ""], ["إجمالي الباقة", plan.total, "text-gold2"], [plan.remaining >= 0 ? "المتبقي" : "الزيادة", Math.abs(plan.remaining), plan.remaining >= 0 ? "text-price" : "text-red-300"]].map(([k, v, c]) => (
              <div key={String(k)} className="rounded-xl bg-bg p-3">
                <div className="text-[10px] text-white/45">{k}</div>
                <div className={`mt-0.5 text-sm font-black ${c}`}>{formatSAR(Number(v))}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {plan.lines.map((l, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl bg-bg p-3">
                <button onClick={() => setOpen(l.product)} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.product.imageUrl} alt="" className="h-16 w-14 rounded-lg object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black text-gold2">{l.role}</div>
                  <button onClick={() => setOpen(l.product)} className="block text-right text-sm font-bold hover:text-gold2">{l.product.nameAr}</button>
                  <div className="text-[10px] text-white/50">
                    {CONDITION_LABEL[l.product.condition]} · {l.product.originAr} · {capacityLabel(l.product.category, l.product.capacityKg)} · ضمان {l.product.guaranteeMonths} شهر
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-white/45">{l.qty} × {formatSAR(l.product.price)}</div>
                  <div className="text-sm font-black text-price">{formatSAR(l.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-3 space-y-1">
            {plan.notes.map((n) => <li key={n} className="text-[11px] text-white/55">💡 {n}</li>)}
          </ul>
        </div>
      )}

      {/* ── search results ── */}
      {results.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <h2 className="text-sm font-black">النتائج <span className="text-white/45">({meta?.count})</span></h2>
            {meta?.priceRange && (
              <span className="text-[11px] text-white/55">
                الأسعار من <b className="text-price">{formatSAR(meta.priceRange.min)}</b> إلى <b className="text-price">{formatSAR(meta.priceRange.max)}</b>
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {results.map((p) => (
              <div key={p.id} className="flex justify-center">
                <ProductCard product={p} onOpen={setOpen} favorite={favorites.includes(p.id)} onFavorite={onFav} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!busy && !plan && results.length === 0 && meta && (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center text-white/45">
          لا توجد نتائج مطابقة — جرّب توسيع نطاق السعر أو تغيير القسم
        </div>
      )}

      {open && <ProductModal product={open} onClose={() => setOpen(null)} onUpdated={(p) => setOpen(p)} />}
    </div>
  );
}

export default function SearchClient() {
  return <Suspense fallback={<div className="p-10 text-center text-white/40">...</div>}><Inner /></Suspense>;
}
