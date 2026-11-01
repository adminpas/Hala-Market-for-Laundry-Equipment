"use client";

import { useState } from "react";
import { CONDITION_LABEL, capacityLabel, formatSAR } from "@/lib/catalog";
import type { ConditionKey } from "@/db/schema";
import { BRAND } from "@/lib/brand";

type Item = {
  role: string; qty: number;
  product: {
    id: number; nameAr: string; price: number; imageUrl: string; condition: ConditionKey;
    originAr: string; capacityKg: number; category: string; guaranteeMonths: number; brand: string;
  } | null;
};
type Bundle = {
  id: number; nameAr: string; shopType: string; description: string; imageUrl: string;
  listPrice: number; bundlePrice: number; capacityNote: string; warrantyMonths: number;
  includesInstall: boolean; includesTraining: boolean; items: Item[]; savings: number; savingsPct: number;
};

const SHOP_META: Record<string, { icon: string; label: string }> = {
  small: { icon: "🏠", label: "مغسلة عادية" },
  medium: { icon: "🏢", label: "مغسلة متوسطة" },
  central: { icon: "🏭", label: "مغسلة مركزية" },
  hotel: { icon: "🏨", label: "فنادق" },
  hospital: { icon: "🏥", label: "مستشفيات" },
  carpet: { icon: "🧶", label: "سجاد وموكيت" },
};

export default function BundlesClient({ bundles }: { bundles: Bundle[] }) {
  const [filter, setFilter] = useState<string>("");
  const [openId, setOpenId] = useState<number | null>(null);

  const list = filter ? bundles.filter((b) => b.shopType === filter) : bundles;
  const types = [...new Set(bundles.map((b) => b.shopType))];

  async function order(b: Bundle) {
    const lines = b.items
      .filter((i) => i.product)
      .map((i) => `• ${i.role}: ${i.product!.nameAr} × ${i.qty}`)
      .join("%0A");
    const msg =
      `السلام عليكم، أرغب في طلب:%0A*${b.nameAr}*%0A%0A${lines}%0A%0A` +
      `السعر: ${b.bundlePrice.toLocaleString("en-US")} ر.س%0A(بدلاً من ${b.listPrice.toLocaleString("en-US")} — توفير ${b.savingsPct}%25)`;
    window.open(`https://wa.me/${BRAND.whatsappIntl}?text=${msg}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">TURNKEY PACKAGES</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">📦 العروض المتكاملة — مغسلة جاهزة بصفقة واحدة</h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-white/60">
          كل ما تحتاجه لتجهيز مغسلتك في باقة واحدة: المعدات + النقل + التركيب الميداني + التدريب على التشغيل + الضمان.
        </p>
      </div>

      {/* filter */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter("")}
          className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-black transition ${!filter ? "btn-gold" : "chip"}`}>
          كل الباقات ({bundles.length})
        </button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-black transition ${filter === t ? "btn-gold" : "chip"}`}>
            {SHOP_META[t]?.icon} {SHOP_META[t]?.label ?? t}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {list.map((b) => {
          const isOpen = openId === b.id;
          const totalUnits = b.items.reduce((s, i) => s + i.qty, 0);
          return (
            <div key={b.id} className="panel overflow-hidden rounded-2xl">
              <div className="relative h-36 overflow-hidden sm:h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/50 to-transparent" />
                <span className="absolute right-3 top-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-black text-gold2 backdrop-blur">
                  {SHOP_META[b.shopType]?.icon} {SHOP_META[b.shopType]?.label}
                </span>
                <span className="absolute left-3 top-3 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-black text-white shadow-lg">
                  وفّر {b.savingsPct}%
                </span>
                <div className="absolute inset-x-3 bottom-2">
                  <h2 className="text-[15px] font-black leading-tight sm:text-lg">{b.nameAr}</h2>
                  <p className="text-[10px] text-white/60">{b.capacityNote}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-white/45">سعر الباقة شاملاً التركيب</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-price">{formatSAR(b.bundlePrice)}</span>
                      <span className="text-xs text-white/35 line-through">{formatSAR(b.listPrice)}</span>
                    </div>
                    <div className="text-[10px] font-bold text-gold2">توفير {formatSAR(b.savings)}</div>
                  </div>
                  <div className="flex gap-1.5 text-center text-[9px]">
                    <span className="rounded-lg bg-bg px-2 py-1.5"><b className="block text-sm text-white">{totalUnits}</b>قطعة</span>
                    <span className="rounded-lg bg-bg px-2 py-1.5"><b className="block text-sm text-white">{b.warrantyMonths}</b>شهر ضمان</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  {b.includesInstall && <span className="rounded-full bg-price/12 px-2.5 py-1 font-bold text-price">🚛 نقل وتركيب ميداني</span>}
                  {b.includesTraining && <span className="rounded-full bg-sky-500/12 px-2.5 py-1 font-bold text-sky-300">🎓 تدريب على التشغيل</span>}
                  <span className="rounded-full bg-gold/12 px-2.5 py-1 font-bold text-gold2">🛡️ ضمان شامل</span>
                </div>

                <button onClick={() => setOpenId(isOpen ? null : b.id)}
                  className="btn-ghost mt-3 w-full rounded-xl py-2 text-xs font-bold">
                  {isOpen ? "▲ إخفاء محتويات الباقة" : `▼ عرض محتويات الباقة (${b.items.length} بنود)`}
                </button>

                {isOpen && (
                  <div className="fade-up mt-2 space-y-2">
                    {b.items.map((it, i) => it.product && (
                      <div key={i} className="flex items-center gap-2.5 rounded-xl bg-bg p-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.product.imageUrl} alt="" className="h-14 w-12 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-black text-gold2">{it.role}</div>
                          <div className="truncate text-[12px] font-bold">{it.product.nameAr}</div>
                          <div className="text-[9px] text-white/50">
                            {CONDITION_LABEL[it.product.condition]} · {it.product.originAr} · {capacityLabel(it.product.category, it.product.capacityKg)}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-[9px] text-white/45">×{it.qty}</div>
                          <div className="text-[12px] font-black text-price">{formatSAR(it.product.price * it.qty)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => order(b)} className="btn-gold rounded-xl py-3 text-sm">💬 اطلب الباقة الآن</button>
                  <a href="/search" className="btn-ghost rounded-xl py-3 text-center text-sm font-bold">🧮 خصّص باقتك</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center text-white/45">
          لا توجد باقات في هذا التصنيف حالياً
        </div>
      )}
    </div>
  );
}
