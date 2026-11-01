"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateLogistics, formatSAR, SAUDI_CITIES } from "@/lib/catalog";

type Row = {
  id: number; mode: "buy" | "reserve";
  product: { id: number; nameAr: string; price: number; imageUrl: string; condition: string; weightKg: number; isSold: boolean; reserved: boolean; reservedByMe: boolean } | null;
};
type Cust = { id: number; fullName: string; phone: string; city: string; address: string; district: string; distanceKm: number | null; lat: number | null };

export default function CartPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [cust, setCust] = useState<Cust | null>(null);
  const [pay, setPay] = useState<{
    enableMada: boolean;
    enableApplePay: boolean;
    enableTransfer: boolean;
    beneficiaryName: string;
    bankName: string;
    ibanMasked: string;
    isApproved: boolean;
    gateway?: { mode: string; live: boolean; provider: string };
  } | null>(null);
  const [method, setMethod] = useState<"mada" | "apple_pay" | "transfer">("mada");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [depositPct, setDepositPct] = useState(5);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const load = useCallback(async () => {
    const [c, k, p] = await Promise.all([
      fetch("/api/customer").then((r) => r.json()),
      fetch("/api/cart").then((r) => r.json()),
      fetch("/api/payment-settings").then((r) => r.json()),
    ]);
    if (!c.customer) return router.replace("/account?next=/cart");
    setCust(c.customer);
    setRows(k.items ?? []);
    setPay(p.settings);
    if (!p.settings.enableMada) setMethod(p.settings.enableApplePay ? "apple_pay" : "transfer");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const km = cust?.distanceKm ?? SAUDI_CITIES.find((c) => c.name === cust?.city)?.km ?? 18;
  const buys = rows.filter((r) => r.mode === "buy" && r.product);
  const reserves = rows.filter((r) => r.mode === "reserve" && r.product);

  const totals = buys.reduce(
    (acc, r) => {
      const c = calculateLogistics(km, r.product!.weightKg, r.product!.price);
      return {
        subtotal: acc.subtotal + c.subtotal,
        shipping: acc.shipping + c.shippingFee,
        install: acc.install + c.installationFee,
        vat: acc.vat + c.vat,
        total: acc.total + c.total,
      };
    },
    { subtotal: 0, shipping: 0, install: 0, vat: 0, total: 0 },
  );

  async function remove(id: number) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    load();
  }

  async function checkout() {
    if (!acceptedTerms) {
      setMsg("يجب الموافقة على شروط البيع والحجز والخصوصية قبل المتابعة");
      return;
    }
    setBusy(true);
    setMsg(null);
    const done: string[] = [];
    // reservations first (free, 24h)
    for (const r of reserves) {
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: r.product!.id, customerName: cust!.fullName, phone: cust!.phone,
          depositPercent: depositPct,
          depositMethod: method === "transfer" ? "bank_transfer" : method,
          acceptedLegal: acceptedTerms,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        done.push(`${d.payment?.testMode ? "اختبار حجز" : d.payment?.status === "pending" ? "حجز بانتظار العربون" : "حجز مؤكد"}: ${r.product!.nameAr} — ${d.payment?.message ?? ""}`);
        await fetch(`/api/cart?id=${r.id}`, { method: "DELETE" });
      } else {
        setMsg(d.error || "تعذر إتمام الحجز");
      }
    }
    // purchases
    let lastOrder: number | null = null;
    for (const r of buys) {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: r.product!.id, customerName: cust!.fullName, phone: cust!.phone,
          city: cust!.city, address: `${cust!.district} ${cust!.address}`.trim(),
          distanceKm: km,
          paymentMethod: method === "transfer" ? "bank_transfer" : method,
          acceptedLegal: acceptedTerms,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        lastOrder = d.order.id;
        done.push(`${d.payment?.testMode ? "طلب اختبار" : d.payment?.status === "pending" ? "طلب بانتظار الدفع" : "طلب مؤكد"}: ${r.product!.nameAr} — ${d.payment?.message ?? ""}`);
        await fetch(`/api/cart?id=${r.id}`, { method: "DELETE" });
      } else {
        setMsg(d.error || "تعذر إنشاء طلب الشراء");
      }
    }
    setBusy(false);
    if (done.length === 0) return setMsg("تعذر إتمام العملية — تأكد من توفر المعدات");
    if (lastOrder) router.push(`/invoice/${lastOrder}`);
    else { setMsg(done.join("\n")); load(); }
  }

  if (loading) return <div className="p-16 text-center text-white/40">جاري التحميل...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black">🛒 سلة المشتريات</h1>
        <div className="text-sm text-white/55">{cust?.fullName} · {cust?.phone} · {cust?.city} ({km} كم)</div>
      </div>

      {rows.length === 0 ? (
        <div className="panel mt-6 rounded-2xl p-12 text-center">
          <div className="text-5xl">🛒</div>
          <p className="mt-3 text-white/55">السلة فارغة</p>
          <Link href="/" className="btn-gold mt-4 inline-block rounded-xl px-5 py-3 text-sm">تصفح المعدات</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {rows.map((r) => r.product && (
              <div key={r.id} className="panel flex flex-wrap items-center gap-3 rounded-2xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.product.imageUrl} alt="" className="h-20 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-black ${r.mode === "reserve" ? "bg-amber-500 text-bg" : "bg-price text-bg"}`}>
                    {r.mode === "reserve" ? "حجز 24 ساعة بعربون" : "شراء"}
                  </span>
                  <div className="mt-1 font-bold">{r.product.nameAr}</div>
                  <div className="text-lg font-black text-price">{formatSAR(r.product.price)}</div>
                  {r.product.isSold && <div className="text-xs text-red-300">⚠️ تم بيع هذه القطعة</div>}
                  {r.product.reserved && !r.product.reservedByMe && <div className="text-xs text-red-300">⚠️ محجوزة لعميل آخر</div>}
                </div>
                <button onClick={() => remove(r.id)} className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300">حذف</button>
              </div>
            ))}
          </div>

          <aside className="panel panel-glow h-fit rounded-2xl p-5 lg:sticky lg:top-24">
            <h3 className="text-lg font-black">🧾 الملخص</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-white/60">قيمة المعدات ({buys.length})</dt><dd className="font-bold">{formatSAR(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-white/60">الشحن ({km} كم)</dt><dd className="font-bold">{formatSAR(totals.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-white/60">التركيب الميداني</dt><dd className="font-bold">{formatSAR(totals.install)}</dd></div>
              <div className="flex justify-between"><dt className="text-white/60">ضريبة 15%</dt><dd className="font-bold">{formatSAR(totals.vat)}</dd></div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-lg"><dt className="font-black">الإجمالي</dt><dd className="font-black text-price">{formatSAR(totals.total)}</dd></div>
              {reserves.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                  <div className="text-[11px] font-black text-amber-300">⏳ {reserves.length} حجز 24 ساعة — يتطلب دفع عربون (غير مجاني)</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-white/55">نسبة العربون:</span>
                    {[5, 10, 20].map((p) => (
                      <button key={p} onClick={() => setDepositPct(p)} className={`rounded px-2 py-0.5 text-[10px] font-black ${depositPct === p ? "bg-amber-500 text-bg" : "bg-white/10 text-white/60"}`}>{p}%</button>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] font-black text-amber-200">
                    قيمة العربون: {formatSAR(Math.round(reserves.reduce((a, r) => a + (r.product?.price ?? 0), 0) * depositPct / 100))}
                  </div>
                  <div className="text-[9px] text-white/45">الحد الأدنى للعربون 100 ر.س · يُخصم من قيمة المعدة عند الشراء خلال 24 ساعة.</div>
                </div>
              )}
            </dl>

            <div className="mt-4">
              <div className="text-xs font-black text-gold2">💳 الدفع إلى حساب الشركة المعتمد</div>
              <div className="mt-1 rounded-lg bg-bg p-2 text-[11px] text-white/60">
                {pay?.beneficiaryName} · {pay?.bankName}<br />
                <span className="font-mono">{pay?.ibanMasked}</span>
                {pay?.isApproved && <span className="mr-1 text-price">✔ معتمد</span>}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {pay?.enableMada && <button onClick={() => setMethod("mada")} className={`rounded-lg border p-2 text-[11px] font-black ${method === "mada" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}>🏦 مدى</button>}
                {pay?.enableApplePay && <button onClick={() => setMethod("apple_pay")} className={`rounded-lg border p-2 text-[11px] font-black ${method === "apple_pay" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}> Pay</button>}
                {pay?.enableTransfer && <button onClick={() => setMethod("transfer")} className={`rounded-lg border p-2 text-[11px] font-black ${method === "transfer" ? "border-gold bg-gold/10" : "border-white/10 bg-bg"}`}>🏧 تحويل</button>}
              </div>
              {method === "transfer" ? (
                <div className="mt-2 rounded-lg bg-gold/8 p-2 text-[10px] text-white/60">التحويل يبقى بانتظار تحقق الإدارة ولا تُقفل القطعة قبل التأكيد.</div>
              ) : pay?.gateway?.live ? (
                <div className="mt-2 rounded-lg bg-price/8 p-2 text-[10px] text-white/60">الدفع يتم عبر صفحة بوابة {pay.gateway.provider} المستضافة؛ لا نخزن بيانات البطاقة.</div>
              ) : (
                <div className="mt-2 rounded-lg bg-purple-500/10 p-2 text-[10px] text-purple-200">🧪 مدى وApple Pay في وضع اختبار فقط؛ لا تُخصم أموال ولا تُباع القطعة.</div>
              )}
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-bg p-3 text-[10.5px] leading-relaxed text-white/65">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c5a059]" />
              <span>أوافق على <a href="/legal#terms" target="_blank" className="font-bold text-gold2 underline">الشروط</a> و<a href="/legal#privacy" target="_blank" className="font-bold text-gold2 underline">الخصوصية</a> وسياسة الحجز والعربون.</span>
            </label>

            {msg && <div className="mt-3 whitespace-pre-line rounded-xl bg-white/5 p-3 text-sm">{msg}</div>}
            <button disabled={busy} onClick={checkout} className="btn-gold mt-4 w-full rounded-xl py-3.5 text-base disabled:opacity-60">
              {busy ? "جاري التنفيذ..." : buys.length ? `ادفع ${formatSAR(totals.total)}` : `ادفع العربون ${formatSAR(Math.max(100, Math.round(reserves.reduce((a, r) => a + (r.product?.price ?? 0), 0) * depositPct / 100)))}`}
            </button>
            <p className="mt-2 text-center text-[10px] text-white/40">🔒 لا يُسجل الطلب مدفوعاً إلا بعد تحقق بوابة الدفع أو تأكيد التحويل البنكي من الإدارة.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
