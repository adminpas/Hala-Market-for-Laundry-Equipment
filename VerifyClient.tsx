"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CONDITION_LABEL, capacityLabel } from "@/lib/catalog";
import type { ConditionKey } from "@/db/schema";

type Passport = {
  id: number; serialNo: string; verifyCode: string; manufactureYear: number | null;
  operatingHours: number; inspectionScore: number; inspectedBy: string;
  inspectedAt: string | null; partsReplaced: string[]; notes: string;
};
type Prod = { id: number; nameAr: string; brand: string; condition: ConditionKey; imageUrl: string; originAr: string; capacityKg: number; category: string; guaranteeMonths: number };
type Ev = { id: number; kind: string; title: string; detail: string; byName: string; createdAt: string };

const KIND: Record<string, { icon: string; label: string }> = {
  inspection: { icon: "🔍", label: "فحص" }, repair: { icon: "🔧", label: "إصلاح" },
  sale: { icon: "🧾", label: "بيع" }, install: { icon: "🚛", label: "تركيب" }, service: { icon: "⚙️", label: "صيانة" },
};

function Inner() {
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get("code") ?? "");
  const [data, setData] = useState<{ passport: Passport; product: Prod | null; events: Ev[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async (c: string) => {
    if (!c.trim()) return;
    setBusy(true); setErr(null); setData(null);
    try {
      const r = await fetch(`/api/passport?code=${encodeURIComponent(c.trim().toUpperCase())}`);
      const d = await r.json();
      if (!r.ok || !d.found) setErr(d.error || "لم يتم العثور على البطاقة");
      else setData({ passport: d.passport, product: d.product, events: d.events ?? [] });
    } catch { setErr("تعذر الاتصال"); }
    setBusy(false);
  }, []);

  useEffect(() => {
    const c = sp.get("code");
    if (c) { const id = setTimeout(() => lookup(c), 0); return () => clearTimeout(id); }
  }, [sp, lookup]);

  const score = data?.passport.inspectionScore ?? 0;
  const sColor = score >= 85 ? "#10b981" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <div className="panel panel-glow rounded-2xl p-6">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">EQUIPMENT PASSPORT</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">🛡️ التحقق من بطاقة المعدة</h1>
        <p className="mt-1 text-sm text-white/60">
          كل معدة في منصتنا لها هوية رقمية موثقة بسجل فحص وصيانة كامل. أدخل رمز التحقق المرفق مع المعدة أو في عرضها.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="mt-4 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="رمز التحقق (مثال: A1B2C3D4E5)"
            className="input flex-1 font-mono uppercase" />
          <button disabled={busy} className="btn-gold rounded-xl px-6 text-sm disabled:opacity-60">{busy ? "..." : "تحقق"}</button>
        </form>
        {err && <div className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-300">❌ {err}</div>}
      </div>

      {data && (
        <div className="fade-up mt-5 space-y-4">
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded bg-price/20 px-2 py-0.5 text-[11px] font-black text-price">✔ بطاقة موثّقة</span>
                <h2 className="mt-2 text-lg font-black">{data.product?.nameAr ?? "معدة"}</h2>
                <p className="text-xs text-white/55">
                  {data.product && `${data.product.brand} · ${data.product.originAr} · ${capacityLabel(data.product.category, data.product.capacityKg)}`}
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/45">الرقم التسلسلي: {data.passport.serialNo}</p>
              </div>
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={sColor} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${score} 100`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black" style={{ color: sColor }}>{score}%</span>
                  <span className="text-[8px] text-white/45">الفحص</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {[
                ["الحالة", data.product ? CONDITION_LABEL[data.product.condition] : "—"],
                ["سنة الصنع", data.passport.manufactureYear ?? "—"],
                ["ساعات التشغيل", data.passport.operatingHours.toLocaleString("en-US")],
                ["الضمان", data.product ? `${data.product.guaranteeMonths} شهر` : "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-bg p-2.5">
                  <div className="text-[10px] text-white/45">{k}</div>
                  <div className="mt-0.5 text-sm font-black">{v}</div>
                </div>
              ))}
            </div>

            {data.passport.partsReplaced.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-black text-gold2">القطع المستبدلة</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data.passport.partsReplaced.map((p) => (
                    <span key={p} className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] text-white/75">🔧 {p}</span>
                  ))}
                </div>
              </div>
            )}
            {data.passport.notes && <p className="mt-3 rounded-lg bg-bg p-3 text-xs text-white/65">{data.passport.notes}</p>}
          </div>

          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">📜 السجل الكامل للمعدة</h3>
            <div className="mt-3 space-y-2">
              {data.events.map((e, i) => (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-sm">{KIND[e.kind]?.icon ?? "•"}</span>
                    {i < data.events.length - 1 && <span className="my-1 w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="text-sm font-black">{e.title}</div>
                    <div className="text-xs text-white/60">{e.detail}</div>
                    <div className="mt-0.5 text-[10px] text-white/35">{e.byName} · {new Date(e.createdAt).toLocaleString("ar-SA")}</div>
                  </div>
                </div>
              ))}
              {data.events.length === 0 && <div className="text-sm text-white/40">لا توجد أحداث مسجلة</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyClient() {
  return <Suspense fallback={<div className="p-10 text-center text-white/40">...</div>}><Inner /></Suspense>;
}
