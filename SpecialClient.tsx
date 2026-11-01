"use client";

import { useEffect, useState } from "react";
import { SAUDI_CITIES, formatSAR } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";

const SECTORS = [
  { k: "home", l: "منزل", i: "🏠" },
  { k: "workshop", l: "معمل / ورشة", i: "🔧" },
  { k: "factory", l: "مصنع", i: "🏭" },
  { k: "company", l: "شركة خاصة", i: "🏢" },
  { k: "government", l: "جهة حكومية", i: "🏛️" },
  { k: "hotel", l: "فندق", i: "🏨" },
  { k: "hospital", l: "مستشفى", i: "🏥" },
  { k: "other", l: "أخرى", i: "📦" },
];

const COUNTRIES = [
  { k: "any", l: "الأنسب سعراً وجودة (نختار لك)" },
  { k: "saudi", l: "داخل المملكة" },
  { k: "uae", l: "الإمارات" },
  { k: "kuwait", l: "الكويت" },
  { k: "qatar", l: "قطر" },
  { k: "bahrain", l: "البحرين" },
  { k: "oman", l: "عُمان" },
  { k: "italy", l: "إيطاليا" },
  { k: "germany", l: "ألمانيا" },
  { k: "usa", l: "أمريكا" },
  { k: "turkey", l: "تركيا" },
  { k: "china", l: "الصين" },
];

const STATUS: Record<string, { l: string; c: string }> = {
  new: { l: "قيد الاستلام", c: "bg-white/10 text-white/70" },
  sourcing: { l: "جاري البحث عن المصدر", c: "bg-sky-500/15 text-sky-300" },
  quoted: { l: "تم إرسال عرض السعر", c: "bg-gold/15 text-gold2" },
  approved: { l: "تمت الموافقة", c: "bg-price/15 text-price" },
  ordered: { l: "تم الطلب من المورّد", c: "bg-purple-500/15 text-purple-300" },
  shipping: { l: "قيد الشحن", c: "bg-amber-500/15 text-amber-300" },
  delivered: { l: "تم التسليم", c: "bg-price/20 text-price" },
  closed: { l: "مغلق", c: "bg-white/5 text-white/40" },
};

type Req = {
  id: number; refNo: string; itemName: string; brand: string; quantity: number;
  sourceCountry: string; status: string; quotedPrice: number | null; etaDays: number | null;
  adminNote: string; createdAt: string;
};

export default function SpecialClient() {
  const [f, setF] = useState({
    customerName: "", phone: "", city: "جدة", sector: "workshop",
    itemName: "", brand: "", model: "", quantity: 1, specs: "",
    sourceCountry: "any", budget: "", urgency: "normal",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ refNo: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState<Req[]>([]);
  const [trackRef, setTrackRef] = useState("");

  useEffect(() => {
    const id = setTimeout(async () => {
      const saved = localStorage.getItem("lx_customer");
      if (saved) {
        const c = JSON.parse(saved);
        setF((s) => ({ ...s, customerName: c.name || "", phone: c.phone || "" }));
      }
      const r = await fetch("/api/special-requests").then((x) => x.json()).catch(() => null);
      if (r?.requests) setMine(r.requests);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const r = await fetch("/api/special-requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, budget: f.budget || undefined }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || "تعذر إرسال الطلب");
    localStorage.setItem("lx_customer", JSON.stringify({ name: f.customerName, phone: f.phone }));
    setDone({ refNo: d.request.refNo });
    setMine((m) => [d.request, ...m]);
  }

  async function track() {
    if (!trackRef.trim()) return;
    const r = await fetch(`/api/special-requests?ref=${encodeURIComponent(trackRef)}`).then((x) => x.json());
    if (r.requests?.length) setMine(r.requests);
    else setErr("لا يوجد طلب بهذا الرقم");
  }

  const wa = () => {
    const msg = `السلام عليكم، أرغب في طلب خاص:%0A*${f.itemName || "معدة"}*%0A${f.brand ? `الماركة: ${f.brand}%0A` : ""}الكمية: ${f.quantity}%0A${f.specs ? `المواصفات: ${f.specs}` : ""}`;
    window.open(`https://wa.me/${BRAND.whatsappIntl}?text=${msg}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">SPECIAL ORDER & IMPORT</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">🌍 الطلبات الخاصة والاستيراد</h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-white/60">
          لم تجد ما تبحث عنه؟ نحن نؤمّن لك <b className="text-white/85">أي معدة أو جهاز</b> للمنازل والمعامل والمصانع
          والشركات والجهات الحكومية — من داخل المملكة أو دول الخليج أو نستورده لك من أي دولة في العالم.
        </p>
      </div>

      {/* value props */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["🔎", "نبحث عنها لك", "شبكة موردين محلية وخليجية وعالمية"],
          ["✈️", "استيراد مباشر", "شحن وتخليص جمركي كامل"],
          ["🧾", "عرض سعر واضح", "السعر النهائي ومدة التوريد"],
          ["🛡️", "ضمان وتركيب", "نفس ضمان معداتنا وخدمة ما بعد البيع"]].map(([i, t, d]) => (
          <div key={t} className="panel rounded-xl p-3 text-center">
            <div className="text-2xl">{i}</div>
            <div className="mt-1 text-[12px] font-black">{t}</div>
            <div className="mt-0.5 text-[9.5px] leading-snug text-white/50">{d}</div>
          </div>
        ))}
      </div>

      {done ? (
        <div className="panel panel-glow fade-up mt-5 rounded-2xl p-8 text-center">
          <div className="text-5xl">✅</div>
          <h2 className="mt-3 text-xl font-black">تم استلام طلبك الخاص</h2>
          <p className="mt-1 text-sm text-white/60">رقم المتابعة الخاص بك</p>
          <div className="mx-auto mt-2 inline-block rounded-xl bg-gold/12 px-5 py-2 font-mono text-xl font-black text-gold2">
            {done.refNo}
          </div>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-white/55">
            سيتواصل معك فريق التوريد خلال 24 ساعة بعرض السعر ومدة التوريد. احتفظ برقم المتابعة لمعرفة حالة طلبك في أي وقت.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={wa} className="btn-gold rounded-xl px-5 py-3 text-sm">💬 متابعة عبر واتساب</button>
            <button onClick={() => setDone(null)} className="btn-ghost rounded-xl px-5 py-3 text-sm font-bold">طلب آخر</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">📝 تفاصيل القطعة المطلوبة</h3>
            <div className="mt-3 space-y-2">
              <input required className="input" placeholder="اسم المعدة أو الجهاز المطلوب *" value={f.itemName} onChange={(e) => setF({ ...f, itemName: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-3">
                <input className="input" placeholder="الماركة (اختياري)" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
                <input className="input" placeholder="الموديل (اختياري)" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
                <input className="input" type="number" min={1} placeholder="الكمية" value={f.quantity} onChange={(e) => setF({ ...f, quantity: Number(e.target.value) || 1 })} />
              </div>
              <textarea rows={4} className="input" placeholder="المواصفات المطلوبة: السعة، الطاقة، الأبعاد، أي تفاصيل فنية تساعدنا في تأمين القطعة بدقة..." value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs"><span className="mb-1 block text-white/50">مصدر التوريد المفضل</span>
                  <select className="input" value={f.sourceCountry} onChange={(e) => setF({ ...f, sourceCountry: e.target.value })}>
                    {COUNTRIES.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
                  </select>
                </label>
                <label className="text-xs"><span className="mb-1 block text-white/50">الميزانية التقريبية (اختياري)</span>
                  <input className="input" type="number" placeholder="بالريال" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="panel rounded-2xl p-5">
              <h3 className="font-black text-gold2">🏢 جهة الاستخدام</h3>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {SECTORS.map((s) => (
                  <button key={s.k} type="button" onClick={() => setF({ ...f, sector: s.k })}
                    className={`rounded-xl border p-2 text-center text-[11px] font-bold transition ${f.sector === s.k ? "border-gold bg-gold/12 text-gold2" : "border-white/10 bg-bg text-white/60"}`}>
                    <div className="text-lg">{s.i}</div>{s.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel rounded-2xl p-5">
              <h3 className="font-black text-gold2">👤 بياناتك</h3>
              <div className="mt-2 space-y-2">
                <input required className="input" placeholder="الاسم / اسم المنشأة *" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} />
                <input required className="input" inputMode="tel" placeholder="رقم الجوال *" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                <select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                  {SAUDI_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
                <label className="flex items-center gap-2 rounded-xl bg-bg p-2.5 text-xs">
                  <input type="checkbox" checked={f.urgency === "urgent"} onChange={(e) => setF({ ...f, urgency: e.target.checked ? "urgent" : "normal" })} className="h-4 w-4 accent-[#ef4444]" />
                  <span className="font-bold">⚡ طلب عاجل — أحتاجه بأسرع وقت</span>
                </label>
              </div>
            </div>

            {err && <div className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{err}</div>}
            <button disabled={busy} className="btn-gold w-full rounded-xl py-3.5 text-base disabled:opacity-60">
              {busy ? "جاري الإرسال..." : "🌍 أرسل طلب التوريد"}
            </button>
            <button type="button" onClick={wa} className="btn-ghost w-full rounded-xl py-2.5 text-xs font-bold">💬 أو تواصل مباشرة عبر واتساب</button>
          </div>
        </form>
      )}

      {/* tracking */}
      <div className="panel mt-5 rounded-2xl p-5">
        <h3 className="font-black text-gold2">🔎 تتبع طلب سابق</h3>
        <div className="mt-2 flex gap-2">
          <input className="input flex-1 font-mono uppercase" placeholder="أدخل رقم المتابعة (SR-2026-XXXXX)" value={trackRef} onChange={(e) => setTrackRef(e.target.value)} />
          <button onClick={track} className="btn-ghost rounded-xl px-5 text-sm font-bold">تتبع</button>
        </div>

        {mine.length > 0 && (
          <div className="mt-3 space-y-2">
            {mine.map((r) => {
              const st = STATUS[r.status] ?? STATUS.new;
              return (
                <div key={r.id} className="rounded-xl bg-bg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-white/45">{r.refNo}</span>
                      <div className="text-sm font-black">{r.itemName} {r.brand && `· ${r.brand}`} × {r.quantity}</div>
                      <div className="text-[10px] text-white/45">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</div>
                    </div>
                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${st.c}`}>{st.l}</span>
                  </div>
                  {(r.quotedPrice || r.etaDays) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {r.quotedPrice ? <span className="rounded-lg bg-price/12 px-2.5 py-1 font-black text-price">عرض السعر: {formatSAR(r.quotedPrice)}</span> : null}
                      {r.etaDays ? <span className="rounded-lg bg-gold/12 px-2.5 py-1 font-bold text-gold2">مدة التوريد: {r.etaDays} يوم</span> : null}
                    </div>
                  )}
                  {r.adminNote && <p className="mt-1.5 rounded-lg bg-white/[0.03] p-2 text-[11px] text-white/65">📩 {r.adminNote}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
