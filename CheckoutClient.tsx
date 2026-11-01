"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicProduct } from "@/lib/data";
import { SAUDI_CITIES, WAREHOUSE, calculateLogistics, formatSAR, haversineKm } from "@/lib/catalog";
import { ConditionBadge } from "./ProductCard";

export default function CheckoutClient({ product }: { product: PublicProduct }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(SAUDI_CITIES[0].name);
  const [address, setAddress] = useState("");
  const [km, setKm] = useState<number>(SAUDI_CITIES[0].km);
  const [kmSource, setKmSource] = useState<"city" | "gps" | "manual">("city");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [method, setMethod] = useState<"mada" | "apple_pay" | "bank_transfer">("mada");
  const [gateway, setGateway] = useState<{ mode: string; live: boolean; provider: string }>({ mode: "test", live: false, provider: "" });
  const [availableMethods, setAvailableMethods] = useState({ mada: true, applePay: true, transfer: true });
  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [err, setErr] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    let alive = true;
    const saved = localStorage.getItem("lx_customer");
    if (saved) {
      const c = JSON.parse(saved);
      setTimeout(() => { setName(c.name || ""); setPhone(c.phone || ""); }, 0);
    }
    fetch("/api/payment-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d.settings) return;
        setGateway(d.settings.gateway ?? { mode: "test", live: false, provider: "" });
        setAvailableMethods({
          mada: !!d.settings.enableMada,
          applePay: !!d.settings.enableApplePay,
          transfer: !!d.settings.enableTransfer,
        });
        if (!d.settings.enableMada && d.settings.enableTransfer) setMethod("bank_transfer");
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const calc = useMemo(() => calculateLogistics(km, product.weightKg, product.price), [km, product]);

  function pickCity(n: string) {
    setCity(n);
    const c = SAUDI_CITIES.find((x) => x.name === n);
    if (c) {
      setKm(c.km);
      setKmSource("city");
    }
  }

  function useGps() {
    if (!navigator.geolocation) return setErr("المتصفح لا يدعم تحديد الموقع");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineKm(WAREHOUSE.lat, WAREHOUSE.lng, pos.coords.latitude, pos.coords.longitude);
        // Road distance factor ≈ 1.25× straight-line
        setKm(Math.max(5, Math.round(d * 1.25)));
        setKmSource("gps");
        setGpsLoading(false);
      },
      () => {
        setErr("تعذر تحديد موقعك، اختر المدينة أو أدخل المسافة يدوياً");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function pay() {
    setErr(null);
    if (!address) return setErr("الرجاء تعبئة عنوان موقع التسليم");
    if (!acceptedTerms) return setErr("يجب الموافقة على شروط البيع والخصوصية قبل المتابعة");
    setStep("paying");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, city, address, distanceKm: km, paymentMethod: method, acceptedLegal: acceptedTerms }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/account?next=/checkout/${product.id}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "تعذر إنشاء طلب الدفع");
      setPaymentMessage(data.payment?.message || "تم إنشاء الطلب بانتظار التحقق المالي.");
      setCreatedOrderId(data.order.id);
      setStep("done");
    } catch (e) {
      setErr((e as Error).message);
      setStep("form");
    }
  }

  const locked = product.isSold;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-black md:text-3xl">⚡ الشراء الفوري وحاسبة الشحن والتركيب</h1>
      <p className="mt-1 text-sm text-white/50">تُحسب رسوم الشحن والتركيب الميداني تلقائياً حسب المسافة بالكيلومتر من مستودعنا في جدة إلى موقع مغسلتك.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          {/* Product */}
          <div className="panel flex gap-4 rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt="" className="h-28 w-24 rounded-xl object-cover" />
            <div className="flex-1">
              <ConditionBadge condition={product.condition} />
              <h2 className="mt-1 font-black">{product.nameAr}</h2>
              <div className="text-xs text-white/50">{product.nameEn} · {product.weightKg} كجم · {product.dimensions}</div>
              <div className="mt-2 text-2xl font-black text-price">{formatSAR(product.price)}</div>
            </div>
          </div>

          {/* Customer */}
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">👤 بيانات العميل والموقع</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="الاسم / اسم المنشأة" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input" placeholder="رقم الجوال" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
              <select className="input" value={city} onChange={(e) => pickCity(e.target.value)}>
                {SAUDI_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} — {c.km} كم من المستودع</option>
                ))}
              </select>
              <input className="input" placeholder="عنوان المغسلة بالتفصيل (الحي، الشارع)" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {/* Logistics calculator */}
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">🚛 حاسبة اللوجستيات (المسافة من مستودع جدة)</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={useGps} className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">
                {gpsLoading ? "جاري التحديد..." : "📍 تحديد موقعي تلقائياً (GPS)"}
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-bg px-3 py-1.5">
                <span className="text-xs text-white/50">المسافة يدوياً:</span>
                <input
                  type="number"
                  min={1}
                  className="w-20 bg-transparent text-center font-black text-white outline-none"
                  value={km}
                  onChange={(e) => {
                    setKm(Number(e.target.value));
                    setKmSource("manual");
                  }}
                />
                <span className="text-xs text-white/50">كم</span>
              </div>
              <span className="text-xs text-white/40">
                المصدر: {kmSource === "gps" ? "GPS الجهاز" : kmSource === "city" ? "متوسط المدينة" : "إدخال يدوي"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-bg p-3">
                <div className="text-[11px] text-white/45">المسافة</div>
                <div className="text-xl font-black text-gold2">{calc.km} كم</div>
              </div>
              <div className="rounded-xl bg-bg p-3">
                <div className="text-[11px] text-white/45">رسوم الشحن</div>
                <div className="text-xl font-black">{formatSAR(calc.shippingFee)}</div>
              </div>
              <div className="rounded-xl bg-bg p-3">
                <div className="text-[11px] text-white/45">التركيب الميداني</div>
                <div className="text-xl font-black">{formatSAR(calc.installationFee)}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/40">من: {WAREHOUSE.name} — {WAREHOUSE.address}</p>
          </div>

          {/* Payment */}
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">💳 وسيلة الدفع</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {availableMethods.mada && (
                <button onClick={() => setMethod("mada")} className={`rounded-xl border p-3 text-center font-black transition ${method === "mada" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}>
                  <div className="text-xl">🏦</div><span className="text-xs">مدى</span>
                </button>
              )}
              {availableMethods.applePay && (
                <button onClick={() => setMethod("apple_pay")} className={`rounded-xl border p-3 text-center font-black transition ${method === "apple_pay" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}>
                  <div className="text-xl"> Pay</div><span className="text-xs">Apple Pay</span>
                </button>
              )}
              {availableMethods.transfer && (
                <button onClick={() => setMethod("bank_transfer")} className={`rounded-xl border p-3 text-center font-black transition ${method === "bank_transfer" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}>
                  <div className="text-xl">🏧</div><span className="text-xs">تحويل</span>
                </button>
              )}
            </div>

            {method === "bank_transfer" ? (
              <div className="mt-3 rounded-xl border border-gold/25 bg-gold/8 p-3 text-xs text-white/70">
                سيُنشأ طلب تحويل بنكي بانتظار تحقق الإدارة من وصول المبلغ. لا تُقفل القطعة كمدفوعة قبل التحقق.
              </div>
            ) : gateway.live ? (
              <div className="mt-3 rounded-xl border border-price/25 bg-price/8 p-3 text-xs text-white/70">
                عند المتابعة سيتم تحويلك إلى صفحة بوابة {gateway.provider} المستضافة. المنصة لا تجمع أرقام البطاقات أو CVV.
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-200">
                🧪 وضع اختبار: لن تُخصم أموال ولن تُباع القطعة. الهدف اختبار رحلة الطلب فقط قبل ربط بوابة الدفع الحية.
              </div>
            )}
            <p className="mt-2 text-[10px] text-white/40">🔒 لا تُخزن بيانات البطاقة داخل النظام. الدفع الحي يتطلب بوابة مرخّصة وصفحة دفع مستضافة.</p>
          </div>
        </div>

        {/* Invoice summary */}
        <aside className="panel panel-glow h-fit rounded-2xl p-5 lg:sticky lg:top-24">
          <h3 className="text-lg font-black">🧾 ملخص الفاتورة</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-white/60">سعر الماكينة</dt><dd className="font-bold">{formatSAR(calc.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">الشحن ({calc.km} كم)</dt><dd className="font-bold">{formatSAR(calc.shippingFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">التركيب الميداني</dt><dd className="font-bold">{formatSAR(calc.installationFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">ضريبة القيمة المضافة 15%</dt><dd className="font-bold">{formatSAR(calc.vat)}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-lg"><dt className="font-black">الإجمالي</dt><dd className="font-black text-price">{formatSAR(calc.total)}</dd></div>
          </dl>
          <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-bg p-3 text-[11px] leading-relaxed text-white/65">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c5a059]" />
            <span>
              أوافق على <a href="/legal#terms" target="_blank" className="font-bold text-gold2 underline">شروط البيع</a> و
              <a href="/legal#privacy" target="_blank" className="font-bold text-gold2 underline"> الخصوصية</a> وسياسة الحجز والضمان.
            </span>
          </label>
          {err && <div className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{err}</div>}
          {locked ? (
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-center font-black text-white/50">🔒 هذه الماكينة تم بيعها</div>
          ) : step === "done" ? (
            <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-4 text-center">
              <div className="font-black text-gold2">✅ تم إنشاء الطلب</div>
              <div className="mt-1 text-xs text-white/65">{paymentMessage}</div>
              {createdOrderId && (
                <button onClick={() => router.push(`/invoice/${createdOrderId}`)} className="btn-ghost mt-3 rounded-lg px-4 py-2 text-xs font-bold">عرض الفاتورة/الطلب</button>
              )}
            </div>
          ) : (
            <button onClick={pay} disabled={step === "paying"} className="btn-gold mt-4 w-full rounded-xl px-4 py-4 text-lg disabled:opacity-60">
              {step === "paying"
                ? "⏳ جاري إنشاء طلب الدفع..."
                : method === "bank_transfer"
                  ? `إنشاء طلب تحويل ${formatSAR(calc.total)}`
                  : gateway.live
                    ? `المتابعة للدفع ${formatSAR(calc.total)}`
                    : `اختبار الطلب ${formatSAR(calc.total)}`}
            </button>
          )}
          <p className="mt-3 text-center text-[11px] text-white/40">بالضغط على الدفع فإنك توافق على شروط البيع والتركيب والضمان</p>
        </aside>
      </div>
    </div>
  );
}
