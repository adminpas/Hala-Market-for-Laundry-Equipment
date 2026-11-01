"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/data";
import type { SpecField } from "@/db/schema";
import { capacityLabel, formatSAR } from "@/lib/catalog";
import { ConditionBadge, ReservedBadge } from "./ProductCard";

function useCountdown(iso: string | null) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!iso) return;
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) return setLeft("انتهى");
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [iso]);
  return left;
}

export default function ProductModal({
  product,
  onClose,
  onUpdated,
}: {
  product: PublicProduct;
  onClose: () => void;
  onUpdated: (p: PublicProduct) => void;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mine, setMine] = useState(false);
  const countdown = useCountdown(product.reservedUntilIso);

  // pull the complete record + live category schema on open
  const [full, setFull] = useState(product);
  const [specSchema, setSpecSchema] = useState<SpecField[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/products/${product.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([pd, cd]) => {
        if (!alive) return;
        if (pd.product) setFull(pd.product);
        const category = (cd.categories ?? []).find((c: { key: string; level: number }) => c.key === product.category && c.level === 1);
        setSpecSchema(category?.specSchema ?? []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [product]);

  useEffect(() => {
    const saved = localStorage.getItem("lx_customer");
    if (saved) {
      const c = JSON.parse(saved);
      setTimeout(() => { setName(c.name || ""); setPhone(c.phone || ""); }, 0);
    }
    const myRes = JSON.parse(localStorage.getItem("lx_my_reservations") || "[]") as number[];
    setTimeout(() => setMine(myRes.includes(product.id)), 0);
  }, [product.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /** Add to cart — redirects to the customer login page when not signed in. */
  async function addToCart(mode: "buy" | "reserve") {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, mode }),
      });
      if (res.status === 401) {
        window.location.href = `/account?next=${encodeURIComponent("/cart")}`;
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر الإضافة للسلة");
      setMsg({ ok: true, text: mode === "reserve" ? "أُضيفت للسلة كحجز 24 ساعة — ادفع العربون من السلة لتثبيت الحجز." : "أُضيفت للسلة — أكمل الدفع من السلة." });
      setTimeout(() => (window.location.href = "/cart"), 900);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const lockedForMe = product.isSold || (product.reserved && !mine);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <div
        className="panel panel-glow fade-up relative max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-t-3xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-xl text-white hover:bg-gold hover:text-bg"
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Widescreen player */}
        <div className="relative aspect-video w-full bg-panel2">
          <video
            key={product.videoUrl}
            src={product.videoUrl}
            poster={product.imageUrl}
            controls
            autoPlay
            muted
            playsInline
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-black text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> تشغيل حي من مستودع جدة
          </div>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={product.condition} />
              {product.reserved && <ReservedBadge />}
              {product.isSold && <span className="rounded-md bg-white/80 px-3 py-1 text-sm font-black text-bg">تم البيع</span>}
              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">SKU: {product.sku}</span>
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight md:text-3xl">{product.nameAr}</h2>
            <p className="mt-1 text-sm text-white/50">{product.nameEn} · {product.subcategoryAr}</p>
            <p className="mt-4 leading-relaxed text-white/75">{full.description}</p>

            <h4 className="mt-6 text-sm font-black text-gold2">المميزات</h4>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {full.features.map((f) => (
                <li key={f} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="text-gold">✦</span> {f}
                </li>
              ))}
            </ul>

            <h4 className="mt-6 text-sm font-black text-gold2">المواصفات الفنية الدقيقة</h4>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {[
                ["📐 الأبعاد", full.dimensions],
                ["⚖️ الوزن", `${full.weightKg} كجم`],
                ["⚡ الكهرباء", full.power],
                [full.category === "boilers" ? "♨️ الإنتاجية" : full.category === "presses" ? "📏 مقاس الكبس" : "🧺 السعة", capacityLabel(full.category, full.capacityKg)],
                ["🌍 بلد الصنع", full.originAr],
                ["🛡️ الضمان", `${full.guaranteeMonths} شهر`],
                ...specSchema
                  .filter((field) => full.customAttributes?.[field.key] !== undefined && full.customAttributes?.[field.key] !== "")
                  .map((field) => [
                    `⚙️ ${field.label}`,
                    `${full.customAttributes?.[field.key] === true ? "نعم" : full.customAttributes?.[field.key] === false ? "لا" : full.customAttributes?.[field.key]}${field.unit ? ` ${field.unit}` : ""}`,
                  ]),
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl border border-white/5 bg-bg p-3">
                  <div className="text-[11px] text-white/45">{k}</div>
                  <div className="mt-1 font-bold">{String(v)}</div>
                </div>
              ))}
            </div>
            {full.secondaryCategoryAr && (
              <div className="mt-2 rounded-lg bg-gold/7 px-3 py-2 text-[11px] text-gold2">
                التصنيف الثانوي: <b>{full.secondaryCategoryAr}</b>
              </div>
            )}
          </div>

          {/* Commercial actions */}
          <aside className="panel h-fit rounded-2xl bg-bg p-5 md:sticky md:top-4">
            <div className="text-xs text-white/50">السعر الصافي</div>
            <div className="mt-1 text-4xl font-black text-price">{formatSAR(product.price)}</div>
            {product.oldPrice && <div className="text-sm text-white/40 line-through">{formatSAR(product.oldPrice)}</div>}
            <div className="mt-1 text-[11px] text-white/40">غير شامل الشحن والتركيب والضريبة — تُحسب تلقائياً حسب المسافة</div>

            {product.reserved && (
              <div className={`mt-4 rounded-xl border p-3 text-sm ${mine ? "border-price/40 bg-price/10" : "border-red-500/40 bg-red-500/10"}`}>
                <div className="font-black">{mine ? "✅ محجوزة باسمك" : "⏳ محجوزة مؤقتاً لعميل آخر"}</div>
                <div className="mt-1 text-xs text-white/70">
                  ينتهي الحجز خلال: <span className="font-mono font-black text-white">{countdown}</span>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-2">
              {lockedForMe ? (
                <button disabled className="cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 font-black text-white/40">
                  🔒 {product.isSold ? "تم بيع هذه الماكينة" : "الشراء مقفل حتى انتهاء الحجز"}
                </button>
              ) : (
                <button onClick={() => addToCart("buy")} disabled={loading} className="btn-gold rounded-xl px-4 py-3 text-center disabled:opacity-60">
                  🛒 أضف للسلة واشترِ الآن
                </button>
              )}

              {!product.isSold && !product.reserved && (
                <button onClick={() => addToCart("reserve")} disabled={loading} className="btn-ghost rounded-xl px-4 py-3 font-black disabled:opacity-60">
                  ⏳ احجزها 24 ساعة بعربون
                </button>
              )}
              <p className="text-center text-[10px] text-white/40">الحجز 24 ساعة يتطلب دفع عربون رمزي (يُخصم من السعر عند الشراء)</p>
            </div>

            {msg && (
              <div className={`mt-3 rounded-xl p-3 text-sm ${msg.ok ? "bg-price/15 text-price" : "bg-red-500/15 text-red-300"}`}>{msg.text}</div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <a href="https://wa.me/966555000000" target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366]/15 py-3 text-[#25D366] hover:bg-[#25D366]/25">
                💬 واتساب
              </a>
              <a href="tel:0126000000" className="rounded-xl bg-white/5 py-3 hover:bg-white/10">
                📞 اتصال
              </a>
              <a href="https://maps.google.com/?q=21.4225,39.2262" target="_blank" rel="noreferrer" className="rounded-xl bg-white/5 py-3 hover:bg-white/10">
                📍 المستودع
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
