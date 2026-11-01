"use client";

import { useState } from "react";
import Link from "next/link";
import { formatSAR } from "@/lib/catalog";

type Study = {
  label: string; capitalRange: [number, number];
  equipmentBudget: number; setupCost: number; workingCapital: number;
  monthlyRevenue: number; monthlyCost: number; monthlyProfit: number; marginPct: number;
  paybackMonths: number; breakEvenKgPerDay: number; dailyKg: number;
  readiness: "ready" | "tight" | "insufficient"; verdict: string;
  breakdown: { label: string; value: number }[];
};
type Guide = { title: string; steps: string[]; warnings: string[] };
type Advice = { level: "critical" | "warn" | "good"; title: string; detail: string };

const SIZES = [
  { k: "small", l: "مغسلة حي صغيرة", i: "🏠" },
  { k: "medium", l: "مغسلة متوسطة", i: "🏢" },
  { k: "central", l: "مغسلة مركزية", i: "🏭" },
  { k: "hotel", l: "مغسلة فندق", i: "🏨" },
  { k: "hospital", l: "مغسلة مستشفى", i: "🏥" },
  { k: "carpet", l: "مغسلة سجاد", i: "🧶" },
];

const PHASES = [
  { k: "explore", l: "قبل المزاد", i: "🔍" },
  { k: "prepare", l: "التجهيز", i: "📐" },
  { k: "launch", l: "الانطلاق", i: "🚀" },
  { k: "operate", l: "التشغيل", i: "⚙️" },
  { k: "grow", l: "الاستدامة", i: "📈" },
];

const READY: Record<string, { l: string; c: string }> = {
  ready: { l: "✅ جاهز للبدء", c: "border-price/40 bg-price/10 text-price" },
  tight: { l: "⚠️ ممكن بحذر", c: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  insufficient: { l: "🚫 رأس المال غير كافٍ", c: "border-red-500/40 bg-red-500/10 text-red-300" },
};

export default function AdvisorClient() {
  const [tab, setTab] = useState<"study" | "guide" | "checkup">("study");
  const [busy, setBusy] = useState(false);

  // feasibility
  const [size, setSize] = useState("small");
  const [capital, setCapital] = useState(80000);
  const [study, setStudy] = useState<Study | null>(null);

  // guide
  const [phase, setPhase] = useState("explore");
  const [guide, setGuide] = useState<Guide | null>(null);
  const [followup, setFollowup] = useState<{ day: number; title: string; detail: string }[]>([]);

  // check-up
  const [ck, setCk] = useState({ monthlyRevenue: "", monthlyCost: "", dailyKg: "", capacityKg: "", complaints: "" });
  const [advice, setAdvice] = useState<Advice[] | null>(null);
  const [profit, setProfit] = useState(0);

  // free question
  const [q, setQ] = useState("");
  const [ans, setAns] = useState<{ answer: string; bullets?: string[] } | null>(null);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    const r = await fetch("/api/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((x) => x.json()).catch(() => null);
    setBusy(false);
    return r;
  }

  async function runStudy() {
    const r = await call({ mode: "feasibility", size, capital });
    if (r?.study) { setStudy(r.study); setGuide(r.guide); }
  }
  async function runGuide(p: string) {
    setPhase(p);
    const r = await call({ mode: "guide", phase: p });
    if (r?.guide) { setGuide(r.guide); setFollowup(r.followup ?? []); }
  }
  async function runCheckup() {
    const r = await call({ mode: "diagnose", ...ck });
    if (r?.advice) { setAdvice(r.advice); setProfit(r.profit ?? 0); }
  }
  async function ask() {
    if (!q.trim()) return;
    const r = await call({ question: q });
    if (r?.answer) { setAns({ answer: r.answer, bullets: r.bullets }); setGuide(r.guide); }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">AI PROJECT ADVISOR</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">🧭 مستشار المشروع الذكي</h1>
        <p className="mx-auto mt-1 max-w-2xl text-[12.5px] leading-relaxed text-white/60">
          يرافقك الذكاء من <b className="text-white/85">قبل دخول المزاد</b> — بدراسة جدوى صادقة — وحتى
          <b className="text-white/85"> بعد التركيب والتشغيل</b>، بنصائح لاستدامة مشروعك وتجنّب ما يضرّه.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-panel p-2">
        {([["study", "📊 دراسة جدوى"], ["guide", "🗺️ دليل المراحل"], ["checkup", "🩺 فحص مشروعي"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg px-2 py-2.5 text-[11.5px] font-black transition sm:text-[13px] ${tab === k ? "btn-gold" : "bg-white/[0.04] text-white/65 hover:bg-white/10"}`}>{l}</button>
        ))}
      </div>

      {/* ── 1. feasibility ── */}
      {tab === "study" && (
        <div className="panel mt-4 rounded-2xl p-5">
          <h3 className="font-black text-gold2">📊 هل رأس مالي يكفي؟</h3>
          <p className="mt-1 text-[11px] text-white/50">أرقام واقعية من السوق السعودي — بلا مبالغة ولا وعود.</p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SIZES.map((s) => (
              <button key={s.k} onClick={() => setSize(s.k)}
                className={`rounded-xl border p-2.5 text-center text-[11px] font-bold transition ${size === s.k ? "border-gold bg-gold/12 text-gold2" : "border-white/10 bg-bg text-white/60"}`}>
                <div className="text-lg">{s.i}</div>{s.l}
              </button>
            ))}
          </div>

          <div className="mt-4 text-xs font-black text-gold2">💰 المال المتوفر لديك: <span className="text-lg text-price">{formatSAR(capital)}</span></div>
          <input type="range" min={20000} max={800000} step={5000} value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="mt-2 w-full accent-[#c5a059]" />
          <input type="number" className="input mt-2" value={capital} onChange={(e) => setCapital(Number(e.target.value) || 0)} />

          <button onClick={runStudy} disabled={busy} className="btn-gold mt-3 w-full rounded-xl py-3 disabled:opacity-60">
            {busy ? "⏳ يحلّل..." : "🧮 احسب جدوى مشروعي"}
          </button>

          {study && (
            <div className="fade-up mt-4 space-y-3">
              <div className={`rounded-xl border p-3 ${READY[study.readiness].c}`}>
                <div className="text-sm font-black">{READY[study.readiness].l}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/80">{study.verdict}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[["الإيراد الشهري", study.monthlyRevenue, "text-white"], ["التكاليف", study.monthlyCost, "text-white/70"],
                  ["صافي الربح", study.monthlyProfit, study.monthlyProfit > 0 ? "text-price" : "text-red-300"],
                  ["هامش الربح", study.marginPct, "text-gold2"]].map(([k, v, c], i) => (
                  <div key={String(k)} className="rounded-xl bg-bg p-2.5 text-center">
                    <div className="text-[9.5px] text-white/45">{k}</div>
                    <div className={`mt-0.5 text-[13px] font-black ${c}`}>{i === 3 ? `${v}%` : formatSAR(Number(v))}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-bg p-3 text-center">
                  <div className="text-[9.5px] text-white/45">استرداد رأس المال</div>
                  <div className="text-lg font-black text-gold2">{study.paybackMonths} شهر</div>
                </div>
                <div className="rounded-xl bg-bg p-3 text-center">
                  <div className="text-[9.5px] text-white/45">نقطة التعادل</div>
                  <div className="text-lg font-black text-white">{study.breakEvenKgPerDay} كجم/يوم</div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg p-3 text-center">
                <div className="text-[9.5px] text-white/45">الحجم المتوقع في السنة الأولى (تقدير متحفظ)</div>
                <div className="text-lg font-black text-gold2">{study.dailyKg} كجم يومياً</div>
                <div className="mt-1 text-[10px] text-white/45">
                  يجب أن تتجاوز {study.breakEvenKgPerDay} كجم/يوم لتغطية التكاليف — ما دون ذلك خسارة
                </div>
              </div>

              <div className="rounded-xl bg-bg p-3">
                <div className="text-[11px] font-black text-gold2">توزيع رأس المال والتكاليف</div>
                <div className="mt-2 space-y-1">
                  {study.breakdown.map((b) => (
                    <div key={b.label} className="flex justify-between text-[11px]">
                      <span className="text-white/60">{b.label}</span>
                      <span className="font-bold">{formatSAR(b.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="rounded-lg bg-white/[0.03] p-2 text-[10px] leading-relaxed text-white/45">
                ⚖️ إخلاء مسؤولية: هذه تقديرات استرشادية مبنية على متوسطات السوق السعودي، وتختلف النتائج
                الفعلية حسب الموقع والمنافسة وجهدك التسويقي. استشر فريقنا مجاناً قبل اتخاذ القرار.
              </p>

              <div className="flex gap-2">
                <Link href="/auctions" className="btn-gold flex-1 rounded-xl py-3 text-center text-sm">🔨 ادخل مزاد التمكين</Link>
                <Link href="/search" className="btn-ghost flex-1 rounded-xl py-3 text-center text-sm font-bold">🧮 جهّز باقتي</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. lifecycle guide ── */}
      {tab === "guide" && (
        <div className="panel mt-4 rounded-2xl p-5">
          <h3 className="font-black text-gold2">🗺️ دليل مراحل المشروع</h3>
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {PHASES.map((p) => (
              <button key={p.k} onClick={() => runGuide(p.k)}
                className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-black transition ${phase === p.k && guide ? "btn-gold" : "chip"}`}>
                {p.i} {p.l}
              </button>
            ))}
          </div>

          {!guide && <p className="mt-4 text-center text-[12px] text-white/45">اختر مرحلة مشروعك لعرض الإرشادات</p>}

          {guide && (
            <div className="fade-up mt-4 space-y-3">
              <h4 className="text-[13px] font-black">{guide.title}</h4>
              <div className="space-y-1.5">
                {guide.steps.map((s, i) => (
                  <div key={i} className="flex gap-2 rounded-xl bg-bg p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-price/20 text-[10px] font-black text-price">{i + 1}</span>
                    <span className="text-[11.5px] leading-relaxed text-white/80">{s}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-3">
                <div className="text-[11.5px] font-black text-red-300">⛔ احذر — أخطاء تضرّ مشروعك</div>
                <ul className="mt-1.5 space-y-1">
                  {guide.warnings.map((w, i) => <li key={i} className="text-[11px] leading-relaxed text-white/75">• {w}</li>)}
                </ul>
              </div>

              {followup.length > 0 && (
                <div className="rounded-xl border border-gold/25 bg-gold/6 p-3">
                  <div className="text-[11.5px] font-black text-gold2">🤝 خطة متابعتنا لك بعد التركيب</div>
                  <div className="mt-2 space-y-1.5">
                    {followup.map((f) => (
                      <div key={f.day} className="flex gap-2">
                        <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[9.5px] font-black text-gold2">يوم {f.day}</span>
                        <span className="text-[11px] text-white/75"><b>{f.title}</b> — {f.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 3. operating check-up ── */}
      {tab === "checkup" && (
        <div className="panel mt-4 rounded-2xl p-5">
          <h3 className="font-black text-gold2">🩺 فحص صحة مشروعك</h3>
          <p className="mt-1 text-[11px] text-white/50">أدخل أرقامك الفعلية ليحلّلها الذكاء ويكشف ما يهدّد استمرار مشروعك.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {([["monthlyRevenue", "الإيراد الشهري (ر.س)"], ["monthlyCost", "التكاليف الشهرية (ر.س)"],
               ["dailyKg", "الكمية المنجزة يومياً (كجم)"], ["capacityKg", "الطاقة القصوى للمعدات (كجم)"],
               ["complaints", "عدد الشكاوى شهرياً"]] as const).map(([k, l]) => (
              <input key={k} type="number" className="input" placeholder={l}
                value={ck[k]} onChange={(e) => setCk({ ...ck, [k]: e.target.value })} />
            ))}
          </div>
          <button onClick={runCheckup} disabled={busy} className="btn-gold mt-3 w-full rounded-xl py-3 disabled:opacity-60">
            {busy ? "⏳ يفحص..." : "🩺 افحص مشروعي الآن"}
          </button>

          {advice && (
            <div className="fade-up mt-4 space-y-2">
              {profit !== 0 && (
                <div className={`rounded-xl p-3 text-center ${profit > 0 ? "bg-price/10" : "bg-red-500/10"}`}>
                  <div className="text-[10px] text-white/50">صافي الربح الشهري</div>
                  <div className={`text-2xl font-black ${profit > 0 ? "text-price" : "text-red-300"}`}>{formatSAR(profit)}</div>
                </div>
              )}
              {advice.map((a, i) => (
                <div key={i} className={`rounded-xl border p-3 ${a.level === "critical" ? "border-red-500/40 bg-red-500/10" : a.level === "warn" ? "border-amber-500/35 bg-amber-500/8" : "border-price/30 bg-price/8"}`}>
                  <div className="text-[12.5px] font-black">{a.level === "critical" ? "🚨" : a.level === "warn" ? "⚠️" : "✅"} {a.title}</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-white/75">{a.detail}</p>
                </div>
              ))}
              <Link href="/maintenance" className="btn-ghost block rounded-xl py-3 text-center text-sm font-bold">🔧 اطلب زيارة فني متابعة</Link>
            </div>
          )}
        </div>
      )}

      {/* free question */}
      <div className="panel mt-4 rounded-2xl p-5">
        <h3 className="font-black text-gold2">💬 اسأل مستشار المشاريع</h3>
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-2 flex gap-2">
          <input className="input flex-1" placeholder="مثال: كيف أزيد أرباح مغسلتي؟ · متى أفتح فرعاً ثانياً؟" value={q} onChange={(e) => setQ(e.target.value)} />
          <button disabled={busy} className="btn-gold rounded-xl px-5 text-sm disabled:opacity-60">اسأل</button>
        </form>
        {ans && (
          <div className="fade-up mt-3 rounded-xl border border-gold/25 bg-gold/6 p-3">
            <p className="text-[12px] leading-relaxed text-white/85">🤖 {ans.answer}</p>
            {ans.bullets && <ul className="mt-2 space-y-1">{ans.bullets.map((b, i) => <li key={i} className="text-[11px] text-white/70">• {b}</li>)}</ul>}
          </div>
        )}
      </div>
    </div>
  );
}
