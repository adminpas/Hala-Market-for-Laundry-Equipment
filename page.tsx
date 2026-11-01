"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SAUDI_CITIES, WAREHOUSE, haversineKm } from "@/lib/catalog";

function AccountInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/cart";
  const [mode, setMode] = useState<"login" | "register">("register");
  const [f, setF] = useState({
    username: "", phone: "", password: "", fullName: "", facilityName: "", email: "",
    city: "جدة", district: "", address: "", notes: "",
    lat: null as number | null, lng: null as number | null, distanceKm: null as number | null,
  });
  const [gps, setGps] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  useEffect(() => {
    fetch("/api/customer").then((r) => r.json()).then((d) => {
      if (d.customer) router.replace(next);
    });
  }, [next, router]);

  function locate() {
    if (!navigator.geolocation) return setGps("err");
    setGps("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const d = haversineKm(WAREHOUSE.lat, WAREHOUSE.lng, p.coords.latitude, p.coords.longitude);
        setF((s) => ({ ...s, lat: p.coords.latitude, lng: p.coords.longitude, distanceKm: Math.max(5, Math.round(d * 1.25)) }));
        setGps("ok");
      },
      () => setGps("err"),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === "register" && !acceptedPrivacy) {
      setErr("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام لإنشاء الحساب");
      return;
    }
    setBusy(true);
    const body = mode === "login"
      ? { action: "login", username: f.username, password: f.password }
      : { action: "register", ...f, acceptedLegal: acceptedPrivacy };
    const res = await fetch("/api/customer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(d.error || "تعذر إتمام العملية");
    router.push(next);
    router.refresh();
  }

  const cityKm = SAUDI_CITIES.find((c) => c.name === f.city)?.km ?? 18;
  const km = f.distanceKm ?? cityKm;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <div className="panel panel-glow rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-black">🔐 {mode === "login" ? "تسجيل دخول العميل" : "إنشاء حساب عميل"}</h1>
        <p className="mt-1 text-sm text-white/55">
          مطلوب فقط لإتمام الحجز أو الشراء — نحتاج بياناتك وموقعك لحساب النقل والتركيب والصيانة.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-bg p-1.5">
          {(["register", "login"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg py-2 text-sm font-black transition ${mode === m ? "btn-gold" : "text-white/60"}`}>
              {m === "register" ? "حساب جديد" : "لدي حساب"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required className="input" placeholder="اسم المستخدم — 8 خانات فأكثر *" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
            <input required type="password" minLength={8} className="input" placeholder="كلمة المرور — 8 خانات فأكثر *" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>

          {mode === "register" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <input required className="input" placeholder="رقم الجوال *" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                <input required className="input" placeholder="الاسم الكامل *" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
                <input className="input" placeholder="اسم المنشأة / المغسلة" value={f.facilityName} onChange={(e) => setF({ ...f, facilityName: e.target.value })} />
                <input className="input" placeholder="البريد الإلكتروني (اختياري)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                <select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                  {SAUDI_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
                <input className="input" placeholder="الحي" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} />
                <input required className="input" placeholder="العنوان بالتفصيل *" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
              </div>

              <div className="rounded-xl border border-gold/25 bg-gold/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-gold2">📍 موقع المغسلة (GPS)</div>
                    <div className="text-[11px] text-white/55">يُستخدم لحساب رسوم النقل والتركيب وتوجيه فني الصيانة</div>
                  </div>
                  <button type="button" onClick={locate} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">
                    {gps === "loading" ? "جاري التحديد..." : gps === "ok" ? "✓ تم التحديد" : "تحديد موقعي"}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded bg-bg p-2"><div className="text-white/45">خط العرض</div><div className="font-mono font-bold">{f.lat?.toFixed(4) ?? "—"}</div></div>
                  <div className="rounded bg-bg p-2"><div className="text-white/45">خط الطول</div><div className="font-mono font-bold">{f.lng?.toFixed(4) ?? "—"}</div></div>
                  <div className="rounded bg-bg p-2"><div className="text-white/45">المسافة</div><div className="font-black text-gold2">{km} كم</div></div>
                </div>
                {gps === "err" && <div className="mt-2 text-[11px] text-amber-300">تعذر تحديد الموقع — سنستخدم متوسط مسافة المدينة ({cityKm} كم)</div>}
              </div>

              <textarea rows={2} className="input" placeholder="ملاحظات للتوصيل (مدخل، دور، وقت مناسب...)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            </>
          )}

          {mode === "register" && (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-bg p-3 text-[11px] leading-relaxed text-white/65">
              <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c5a059]" />
              <span>
                أوافق على <a href="/legal#privacy" target="_blank" className="font-bold text-gold2 underline">سياسة الخصوصية</a> و
                <a href="/legal#terms" target="_blank" className="font-bold text-gold2 underline"> شروط الاستخدام</a>.
              </span>
            </label>
          )}
          {err && <div className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{err}</div>}
          <button disabled={busy} className="btn-gold w-full rounded-xl py-3.5 text-base disabled:opacity-60">
            {busy ? "جاري..." : mode === "login" ? "دخول ومتابعة" : "إنشاء الحساب ومتابعة"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white/40">...</div>}>
      <AccountInner />
    </Suspense>
  );
}
