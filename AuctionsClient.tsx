"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatSAR } from "@/lib/catalog";

type Auction = {
  id: number; title: string; description: string; imageUrl: string; kind: string;
  itemsNote: string; marketValue: number; startPrice: number; bidStep: number;
  startsAt: string; endsAt: string; status: string; bidCount: number | null;
  winnerName: string; winnerAmount: number | null; announcedAt: string | null;
  costPrice: number; zeroInterest: boolean; freeInstall: boolean; freeCommissioning: boolean;
  freeConsulting: boolean; maintenanceNote: string; projectNote: string; expectedMonthlyIncome: number;
};

function Countdown({ iso }: { iso: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) return setT("انتهى المزاد");
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setT(d > 0 ? `${d} يوم · ${h} ساعة · ${m} دقيقة` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [iso]);
  return <span className="font-mono font-black text-gold2">{t}</span>;
}

export default function AuctionsClient() {
  const [list, setList] = useState<Auction[]>([]);
  const [bidFor, setBidFor] = useState<Auction | null>(null);
  const [form, setForm] = useState({ bidderName: "", entityName: "", phone: "", city: "جدة", amount: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; receipt?: string } | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/auctions", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d?.auctions) setList(d.auctions);
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      await load();
      const saved = localStorage.getItem("lx_customer");
      if (saved) {
        const c = JSON.parse(saved);
        setForm((f) => ({ ...f, bidderName: c.name || "", phone: c.phone || "" }));
      }
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!bidFor) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/auctions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId: bidFor.id, ...form, amount: Number(form.amount) }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error || "تعذر تسجيل العرض" });
    localStorage.setItem("lx_customer", JSON.stringify({ name: form.bidderName, phone: form.phone }));
    setMsg({ ok: true, text: d.message, receipt: d.receipt });
    setBidFor(null);
    load();
  }

  const live = list.filter((a) => a.status === "live");
  const awarded = list.filter((a) => a.status === "awarded");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">EXCLUSIVE SEALED AUCTION</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">🔨 المزاد الحصري</h1>
        <h2 className="mt-2 text-[13px] font-black text-gold2 sm:text-base">افتح مشروعك بمعدات متكاملة — بسعر التكلفة وبدون أي فائدة</h2>
        <p className="mx-auto mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-white/65">
          مبادرة من شركة النجيب لتشجيع المواطن والمقيم على تحويل ماله المدّخر إلى <b className="text-white/90">مشروع منتج</b> بدلاً
          من تركه راكداً. نطرح باقات مغاسل متكاملة تبدأ من <b className="text-price">سعر التكلفة</b> — بلا فوائد ربوية —
          ويُعلن الفائز في نهاية المدة.
        </p>
      </div>

      {/* trust strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["🚫", "بدون فوائد ربوية", "يبدأ من سعر التكلفة"], ["🛠️", "تركيب وتشغيل مجاني", "هدية للفائز"],
          ["🎓", "استشارة مجانية", "قبل وبعد الدخول"], ["🔒", "عرضك سرّي", "لا يراه أحد سواك"]].map(([i, t, d]) => (
          <div key={t} className="panel rounded-xl p-3 text-center">
            <div className="text-xl">{i}</div>
            <div className="mt-0.5 text-[11.5px] font-black">{t}</div>
            <div className="text-[9px] text-white/50">{d}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`fade-up mt-4 rounded-2xl p-4 text-center ${msg.ok ? "border border-price/35 bg-price/10" : "bg-red-500/15"}`}>
          <div className={`text-sm font-black ${msg.ok ? "text-price" : "text-red-300"}`}>{msg.ok ? "✅" : "❌"} {msg.text}</div>
          {msg.receipt && <div className="mt-1 font-mono text-lg font-black text-gold2">رقم إيصالك: {msg.receipt}</div>}
        </div>
      )}

      {/* live auctions */}
      <div className="mt-5 space-y-4">
        {live.map((a) => (
          <div key={a.id} className="panel overflow-hidden rounded-2xl">
            <div className="relative h-40 sm:h-52">
              {a.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                : <div className="h-full w-full bg-gradient-to-br from-gold/20 to-transparent" />}
              <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
              <span className="badge-flash absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-1 text-[11px] font-black text-white">🔴 مزاد مفتوح</span>
              {a.kind === "bundle" && <span className="absolute left-3 top-3 rounded-lg bg-gold px-2.5 py-1 text-[10px] font-black text-bg">📦 باقة متكاملة</span>}
              <div className="absolute inset-x-3 bottom-2">
                <h2 className="text-lg font-black">{a.title}</h2>
                {a.itemsNote && <p className="text-[10px] text-white/65">{a.itemsNote}</p>}
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs leading-relaxed text-white/70">{a.description}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-xl bg-bg p-2.5">
                  <div className="text-[9px] text-white/45">القيمة السوقية</div>
                  <div className="text-sm font-black text-white/80">{a.marketValue ? formatSAR(a.marketValue) : "—"}</div>
                </div>
                <div className="rounded-xl border border-price/30 bg-price/8 p-2.5">
                  <div className="text-[9px] text-white/45">يبدأ من (سعر التكلفة)</div>
                  <div className="text-sm font-black text-price">{formatSAR(Math.max(a.startPrice, a.costPrice))}</div>
                </div>
                <div className="rounded-xl bg-bg p-2.5">
                  <div className="text-[9px] text-white/45">المشاركون</div>
                  <div className="text-sm font-black text-gold2">{a.bidCount ?? "—"}</div>
                </div>
                <div className="rounded-xl bg-bg p-2.5">
                  <div className="text-[9px] text-white/45">ينتهي خلال</div>
                  <div className="text-[11px]"><Countdown iso={a.endsAt} /></div>
                </div>
              </div>

              {/* what the winner gets — the enablement package */}
              <div className="mt-3 rounded-xl border border-price/25 bg-price/6 p-3">
                <div className="text-[11px] font-black text-price">🎁 ما يحصل عليه الفائز مجاناً</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  {a.freeInstall && <span className="rounded-full bg-white/6 px-2.5 py-1 font-bold">🚛 نقل وتركيب كامل</span>}
                  {a.freeCommissioning && <span className="rounded-full bg-white/6 px-2.5 py-1 font-bold">⚙️ تشغيل وتجربة مجاناً</span>}
                  {a.freeConsulting && <span className="rounded-full bg-white/6 px-2.5 py-1 font-bold">🎓 استشارة تأسيس المشروع</span>}
                  {a.zeroInterest && <span className="rounded-full bg-gold/15 px-2.5 py-1 font-bold text-gold2">🚫 بدون أي فائدة</span>}
                </div>
                {a.maintenanceNote && <p className="mt-1.5 text-[10px] text-white/55">🔧 {a.maintenanceNote}</p>}
                {a.expectedMonthlyIncome > 0 && (
                  <p className="mt-1 text-[10.5px] font-bold text-price">
                    💰 دخل شهري تقديري للمشروع: {formatSAR(a.expectedMonthlyIncome)}
                  </p>
                )}
                {a.projectNote && <p className="mt-1 text-[10px] leading-relaxed text-white/55">{a.projectNote}</p>}
              </div>

              <Link href="/advisor" className="btn-ghost mt-2 block rounded-xl py-2.5 text-center text-[11px] font-bold">
                🧭 لست متأكداً؟ احسب جدوى المشروع أولاً (مجاناً)
              </Link>
              <button onClick={() => { setBidFor(a); setMsg(null); setForm((f) => ({ ...f, amount: String(Math.max(a.startPrice, a.costPrice)) })); }}
                className="btn-gold mt-3 w-full rounded-xl py-3 text-sm">🔒 شارك بعرضك السرّي وافتح مشروعك</button>
              <p className="mt-1.5 text-center text-[10px] text-white/40">
                مبلغك لا يظهر لأي عميل آخر · يُعلن اسم الفائز فقط عند انتهاء المزاد
              </p>
            </div>
          </div>
        ))}

        {live.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/12 p-10 text-center">
            <div className="text-4xl">🔨</div>
            <p className="mt-2 text-sm text-white/50">لا توجد مزادات مفتوحة حالياً — تابعنا لموسم المزاد القادم</p>
          </div>
        )}
      </div>

      {/* winners board */}
      {awarded.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-black"><span>🏆</span> لوحة الفائزين</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {awarded.map((a) => (
              <div key={a.id} className="panel rounded-2xl border border-gold/30 p-4">
                <div className="text-[10px] text-white/45">{a.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-base font-black text-gold2">{a.winnerName}</div>
                    <div className="text-[10px] text-white/50">
                      الفائز بالمزاد {a.announcedAt && `· ${new Date(a.announcedAt).toLocaleDateString("ar-SA")}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* sealed bid modal */}
      {bidFor && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={() => setBidFor(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitBid}
            className="panel panel-glow fade-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">🔒 عرض سرّي — {bidFor.title}</h3>
              <button type="button" onClick={() => setBidFor(null)} className="text-2xl text-white/50">✕</button>
            </div>

            <div className="mt-3 rounded-xl border border-gold/25 bg-gold/8 p-3 text-[11px] leading-relaxed text-white/75">
              🔐 عرضك <b className="text-gold2">مشفّر وسرّي</b>: لا يظهر لأي عميل آخر ولا يمكن لأحد معرفته سوى إدارة المنصة.
              الحد الأدنى <b className="text-price">{formatSAR(Math.max(bidFor.startPrice, bidFor.costPrice))}</b> — وهو سعر التكلفة بدون أي فائدة.
            </div>

            <div className="mt-3 space-y-2">
              <input required className="input" placeholder="الاسم الكامل *" value={form.bidderName} onChange={(e) => setForm({ ...form, bidderName: e.target.value })} />
              <input className="input" placeholder="اسم المغسلة / الشركة / المصنع" value={form.entityName} onChange={(e) => setForm({ ...form, entityName: e.target.value })} />
              <input required className="input" inputMode="tel" placeholder="رقم الجوال *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <label className="block text-xs">
                <span className="mb-1 block text-white/50">قيمة عرضك بالريال *</span>
                <input required type="number" min={Math.max(bidFor.startPrice, bidFor.costPrice)} step={bidFor.bidStep} className="input text-lg font-black text-price"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </label>
              <textarea rows={2} className="input" placeholder="ملاحظة للإدارة (اختياري)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            <button disabled={busy} className="btn-gold mt-4 w-full rounded-xl py-3.5 text-base disabled:opacity-60">
              {busy ? "جاري التسجيل..." : "🔒 أرسل العرض السرّي"}
            </button>
            <p className="mt-2 text-center text-[10px] text-white/40">بإرسال العرض أنت توافق على شروط المزاد وأن العرض مُلزم عند الفوز</p>
          </form>
        </div>
      )}
    </div>
  );
}
