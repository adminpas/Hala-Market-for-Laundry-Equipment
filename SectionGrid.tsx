"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/data";
import type { ConditionKey } from "@/db/schema";
import { CAPACITIES, CONDITION_LABEL, CONDITIONS, GUARANTEES, ORIGINS } from "@/lib/catalog";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

const PAGE = 30;

export default function SectionGrid({
  title, icon, parent, products, initialCondition,
}: {
  title: string; icon: string; parent?: string;
  products: PublicProduct[]; initialCondition: ConditionKey;
}) {
  const [items, setItems] = useState(products);
  const [condition, setCondition] = useState<ConditionKey>(initialCondition);
  const [open, setOpen] = useState<PublicProduct | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [guarantee, setGuarantee] = useState<number | null>(null);
  const [sort, setSort] = useState<"new" | "low" | "high">("new");
  const [limit, setLimit] = useState(PAGE);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setFavorites(JSON.parse(localStorage.getItem("lx_favorites") || "[]")), 0);
    return () => clearTimeout(id);
  }, []);
  const onFavorite = useCallback((id: number) => {
    setFavorites((p) => {
      const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      localStorage.setItem("lx_favorites", JSON.stringify(n));
      return n;
    });
  }, []);

  const filtered = useMemo(() => {
    const out = items.filter(
      (p) => p.condition === condition &&
        (!origin || p.origin === origin) &&
        (!capacity || p.capacityKg === capacity) &&
        (!guarantee || p.guaranteeMonths === guarantee),
    );
    if (sort === "low") out.sort((a, b) => a.price - b.price);
    if (sort === "high") out.sort((a, b) => b.price - a.price);
    return out;
  }, [items, condition, origin, capacity, guarantee, sort]);

  const counts = Object.fromEntries(CONDITIONS.map((c) => [c, items.filter((p) => p.condition === c).length])) as Record<string, number>;
  const chip = (a: boolean) => `chip rounded-full px-3 py-1.5 text-[11px] font-bold ${a ? "chip-active" : ""}`;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <nav className="text-[11px] text-white/45">
            <Link href="/" className="hover:text-gold2">الرئيسية</Link>
            {parent && <> · <span>{parent}</span></>}
          </nav>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black md:text-3xl">
            <span>{icon}</span> {title}
          </h1>
          <p className="text-xs text-white/50">{filtered.length} قطعة معروضة من أصل {items.length}</p>
        </div>
        <Link href="/" className="btn-ghost rounded-lg px-4 py-2 text-xs font-bold">← رجوع للمعرض</Link>
      </div>

      {/* condition switch */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-panel p-2">
        {CONDITIONS.map((c) => (
          <button key={c} onClick={() => { setCondition(c); setLimit(PAGE); }}
            className={`rounded-lg px-2 py-2.5 text-[11px] font-black transition sm:text-[13px] ${condition === c ? "btn-gold" : "bg-white/[0.04] text-white/65 hover:bg-white/10"}`}>
            {CONDITION_LABEL[c]} <span className="opacity-70">({counts[c] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto rounded-lg bg-panel/60 p-2">
        <span className="shrink-0 text-[11px] font-black text-gold2">🌍</span>
        {ORIGINS.map((o) => <button key={o.key} onClick={() => setOrigin(origin === o.key ? null : o.key)} className={chip(origin === o.key)}>{o.nameAr}</button>)}
        <span className="mr-1 shrink-0 text-[11px] font-black text-gold2">🧺</span>
        {CAPACITIES.map((c) => <button key={c} onClick={() => setCapacity(capacity === c ? null : c)} className={chip(capacity === c)}>{c}</button>)}
        <span className="mr-1 shrink-0 text-[11px] font-black text-gold2">🛡️</span>
        {GUARANTEES.map((g) => <button key={g.months} onClick={() => setGuarantee(guarantee === g.months ? null : g.months)} className={chip(guarantee === g.months)}>{g.nameAr}</button>)}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="mr-auto shrink-0 rounded-lg bg-bg px-2 py-1.5 text-[11px] font-bold text-white outline-none">
          <option value="new">الأحدث</option>
          <option value="low">السعر: الأقل</option>
          <option value="high">السعر: الأعلى</option>
        </select>
      </div>

      {/* grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {filtered.slice(0, limit).map((p) => (
          <div key={p.id} className="flex justify-center">
            <ProductCard product={p} onOpen={setOpen} favorite={favorites.includes(p.id)} onFavorite={onFavorite} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-white/10 p-12 text-center text-white/40">لا توجد نتائج مطابقة</div>
      )}

      {limit < filtered.length && (
        <div className="mt-6 text-center">
          <button onClick={() => setLimit((l) => l + PAGE)} className="btn-gold rounded-xl px-8 py-3 text-sm">
            عرض المزيد ({filtered.length - limit} متبقية)
          </button>
        </div>
      )}

      {open && <ProductModal product={open} onClose={() => setOpen(null)} onUpdated={(p) => { setItems((prev) => prev.map((x) => (x.id === p.id ? p : x))); setOpen(p); }} />}
    </div>
  );
}
