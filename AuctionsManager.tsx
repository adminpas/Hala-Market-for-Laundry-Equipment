"use client";

import { useCallback, useEffect, useState } from "react";
import { formatSAR } from "@/lib/catalog";

type Bid = {
  id: number; bidderName: string; entityName: string; phone: string; city: string;
  amount: number; note: string; riskScore: number; flagged: boolean; isWinner: boolean; createdAt: string;
};
type Auction = {
  id: number; title: string; description: string; imageUrl: string; kind: string; itemsNote: string;
  marketValue: number; startPrice: number; reservePrice: number; bidStep: number;
  startsAt: string; endsAt: string; extendedTimes: number; status: string;
  winnerName: string; winnerAmount: number | null; bids: Bid[]; topBid: Bid | null;
};

const STATUS: Record<string, { l: string; c: string }> = {
  draft: { l: "مسودة", c: "bg-white/10 text-white/60" },
  live: { l: "مفتوح", c: "bg-red-600/20 text-red-300" },
  closed: { l: "منتهي — بانتظار الترسية", c: "bg-amber-500/20 text-amber-300" },
  awarded: { l: "تمت الترسية", c: "bg-price/20 text-price" },
  cancelled: { l: "ملغي", c: "bg-white/5 text-white/40" },
};

const empty = {
  title: "", description: "", imageUrl: "", itemsNote: "", kind: "single",
  marketValue: "", startPrice: "", reservePrice: "", bidStep: "500", months: "1", status: "live",
  costPrice: "", expectedMonthlyIncome: "", projectNote: "",
  freeInstall: true, freeCommissioning: true, freeConsulting: true, zeroInterest: true,
};

export default function AuctionsManager() {
  const [rows, setRows] = useState<Auction[]>([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [f, setF] = useState({ ...empty });
  const [openBids, setOpenBids] = useState<number | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/auctions?admin=1", { cache: "no-store" }).then((r) => r.json());
    setRows(d.auctions ?? []);
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function call(method: string, body: unknown) {
    setBusy(true);
    const r = await fetch("/api/auctions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) { alert((await r.json().catch(() => ({}))).error || "خطأ"); return false; }
    await load();
    return true;
  }

  async function create() {
    if (!f.title) return alert("عنوان المزاد مطلوب");
    if (await call("PUT", f)) { setF({ ...empty }); setShowNew(false); }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-gold2">🔨 غرفة تحكم المزادات</h3>
            <p className="text-[11px] text-white/50">العروض سرّية — لا يراها أحد سواك. يمكنك تمديد المدة أو ترسية المزاد في أي وقت.</p>
          </div>
          <button onClick={() => setShowNew((v) => !v)} className="btn-gold rounded-xl px-4 py-2 text-sm">
            {showNew ? "إلغاء" : "＋ مزاد جديد"}
          </button>
        </div>

        {showNew && (
          <div className="fade-up mt-3 grid gap-2 rounded-xl bg-bg p-3 sm:grid-cols-2">
            <input className="input sm:col-span-2" placeholder="عنوان المزاد *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <textarea rows={2} className="input sm:col-span-2" placeholder="وصف المزاد" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <input className="input sm:col-span-2" placeholder="محتويات الباقة / ملاحظة القطع" value={f.itemsNote} onChange={(e) => setF({ ...f, itemsNote: e.target.value })} />
            <input className="input sm:col-span-2 font-mono text-xs" placeholder="رابط الصورة" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} />
            <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              <option value="single">معدة مفردة</option>
              <option value="bundle">باقة متكاملة</option>
            </select>
            <select className="input" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })}>
              <option value="1">مدة شهر</option>
              <option value="2">شهرين</option>
              <option value="3">ثلاثة أشهر (موسمي)</option>
              <option value="6">ستة أشهر</option>
            </select>
            <input className="input" type="number" placeholder="القيمة السوقية" value={f.marketValue} onChange={(e) => setF({ ...f, marketValue: e.target.value })} />
            <input className="input" type="number" placeholder="سعر البداية *" value={f.startPrice} onChange={(e) => setF({ ...f, startPrice: e.target.value })} />
            <input className="input" type="number" placeholder="الحد الأدنى للبيع (سري)" value={f.reservePrice} onChange={(e) => setF({ ...f, reservePrice: e.target.value })} />
            <input className="input" type="number" placeholder="مضاعفة المزايدة" value={f.bidStep} onChange={(e) => setF({ ...f, bidStep: e.target.value })} />
            <input className="input" type="number" placeholder="سعر التكلفة (أقل عرض مقبول)" value={f.costPrice} onChange={(e) => setF({ ...f, costPrice: e.target.value })} />
            <input className="input" type="number" placeholder="الدخل الشهري التقديري للمشروع" value={f.expectedMonthlyIncome} onChange={(e) => setF({ ...f, expectedMonthlyIncome: e.target.value })} />
            <textarea rows={2} className="input sm:col-span-2" placeholder="نبذة عن المشروع وجدواه للعميل" value={f.projectNote} onChange={(e) => setF({ ...f, projectNote: e.target.value })} />
            <div className="sm:col-span-2 rounded-xl bg-panel p-2.5">
              <div className="text-[11px] font-black text-price">🎁 مزايا الفائز</div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {([["zeroInterest", "🚫 بدون فوائد ربوية"], ["freeInstall", "🚛 نقل وتركيب مجاني"],
                   ["freeCommissioning", "⚙️ تشغيل وتجربة مجاناً"], ["freeConsulting", "🎓 استشارة مجانية"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-1.5 text-[11px]">
                    <input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="h-4 w-4 accent-[#10b981]" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <button disabled={busy} onClick={create} className="btn-gold rounded-xl py-2.5 text-sm sm:col-span-2">نشر المزاد</button>
          </div>
        )}
      </div>

      {rows.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">لا توجد مزادات</div>}

      {rows.map((a) => {
        const st = STATUS[a.status] ?? STATUS.draft;
        const isOpen = openBids === a.id;
        const flagged = a.bids.filter((b) => b.flagged).length;
        return (
          <div key={a.id} className="panel rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-black ${st.c}`}>{st.l}</span>
                  {a.kind === "bundle" && <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold2">📦 باقة</span>}
                  {a.extendedTimes > 0 && <span className="rounded bg-white/8 px-2 py-0.5 text-[10px]">مُدِّد {a.extendedTimes}×</span>}
                  {flagged > 0 && <span className="rounded bg-red-600/25 px-2 py-0.5 text-[10px] font-black text-red-300">🤖 {flagged} عرض مشبوه</span>}
                </div>
                <div className="mt-1 text-sm font-black">{a.title}</div>
                <div className="text-[11px] text-white/50">
                  يبدأ من {formatSAR(a.startPrice)} · الحد الأدنى للبيع {a.reservePrice ? formatSAR(a.reservePrice) : "—"} · ينتهي {new Date(a.endsAt).toLocaleDateString("ar-SA")}
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-white/45">أعلى عرض (سرّي)</div>
                <div className="text-lg font-black text-price">{a.topBid ? formatSAR(a.topBid.amount) : "—"}</div>
                <div className="text-[10px] text-white/45">{a.bids.length} مزايد</div>
              </div>
            </div>

            {a.status === "awarded" && (
              <div className="mt-2 rounded-xl border border-gold/30 bg-gold/8 p-2.5 text-[12px]">
                🏆 الفائز المعلن: <b className="text-gold2">{a.winnerName}</b> بمبلغ <b className="text-price">{a.winnerAmount ? formatSAR(a.winnerAmount) : "—"}</b>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button onClick={() => setOpenBids(isOpen ? null : a.id)} className="btn-ghost rounded-lg px-3 py-1.5 text-[11px] font-bold">
                {isOpen ? "▲ إخفاء العروض" : `🔐 عرض العروض السرية (${a.bids.length})`}
              </button>
              {a.status !== "awarded" && (
                <>
                  <button onClick={() => call("PATCH", { id: a.id, action: "extend", months: 1 })} className="rounded-lg bg-white/8 px-3 py-1.5 text-[11px] font-bold">➕ تمديد شهر</button>
                  <button onClick={() => call("PATCH", { id: a.id, action: "extend", months: 3 })} className="rounded-lg bg-white/8 px-3 py-1.5 text-[11px] font-bold">➕ تمديد 3 أشهر</button>
                  {a.status === "draft" && <button onClick={() => call("PATCH", { id: a.id, status: "live" })} className="rounded-lg bg-price/20 px-3 py-1.5 text-[11px] font-bold text-price">▶ نشر</button>}
                  {a.bids.length > 0 && (
                    <button onClick={() => confirm("ترسية المزاد على أعلى عرض وإعلان الفائز؟") && call("PATCH", { id: a.id, action: "award" })}
                      className="btn-gold rounded-lg px-3 py-1.5 text-[11px]">🏆 ترسية وإعلان الفائز</button>
                  )}
                </>
              )}
              <button onClick={() => confirm("حذف المزاد؟") && fetch(`/api/auctions?id=${a.id}`, { method: "DELETE" }).then(load)}
                className="rounded-lg bg-red-500/15 px-3 py-1.5 text-[11px] font-bold text-red-300">حذف</button>
            </div>

            {isOpen && (
              <div className="fade-up mt-3 space-y-1.5">
                <div className="rounded-lg bg-red-500/10 p-2 text-[10px] text-red-200">
                  🔒 هذه البيانات سرّية ومخصصة لإدارة النظام فقط — لا تظهر لأي عميل.
                </div>
                {a.bids.map((b, i) => (
                  <div key={b.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-2.5 text-[11px] ${b.isWinner ? "border border-gold/40 bg-gold/8" : b.flagged ? "bg-red-500/8" : "bg-bg"}`}>
                    <div className="min-w-0">
                      <span className="font-black text-white/50">#{i + 1}</span>
                      <span className="mr-1.5 font-bold">{b.entityName || b.bidderName}</span>
                      {b.isWinner && <span className="mr-1 rounded bg-gold px-1.5 text-[9px] font-black text-bg">فائز</span>}
                      {b.flagged && <span className="mr-1 rounded bg-red-600 px-1.5 text-[9px] font-black text-white">مشبوه {b.riskScore}%</span>}
                      <div className="text-[10px] text-white/45">{b.phone} · {b.city} · {new Date(b.createdAt).toLocaleString("ar-SA")}</div>
                      {b.note && <div className="text-[10px] text-white/55">📝 {b.note}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-price">{formatSAR(b.amount)}</span>
                      {!b.isWinner && a.status !== "awarded" && (
                        <button onClick={() => confirm(`ترسية المزاد على ${b.entityName || b.bidderName}؟`) && call("PATCH", { id: a.id, action: "award", bidId: b.id })}
                          className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold">ترسية عليه</button>
                      )}
                    </div>
                  </div>
                ))}
                {a.bids.length === 0 && <div className="py-4 text-center text-[11px] text-white/40">لا توجد عروض بعد</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
