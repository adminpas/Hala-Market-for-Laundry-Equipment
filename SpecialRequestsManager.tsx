"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpecialRequest } from "@/db/schema";
import { formatSAR } from "@/lib/catalog";

const FLOW: { k: SpecialRequest["status"]; l: string }[] = [
  { k: "new", l: "جديد" },
  { k: "sourcing", l: "جاري البحث" },
  { k: "quoted", l: "تم التسعير" },
  { k: "approved", l: "موافق عليه" },
  { k: "ordered", l: "تم الطلب" },
  { k: "shipping", l: "قيد الشحن" },
  { k: "delivered", l: "تم التسليم" },
  { k: "closed", l: "مغلق" },
];

const SECTOR_AR: Record<string, string> = {
  home: "🏠 منزل", workshop: "🔧 معمل/ورشة", factory: "🏭 مصنع", company: "🏢 شركة",
  government: "🏛️ جهة حكومية", hotel: "🏨 فندق", hospital: "🏥 مستشفى", other: "📦 أخرى",
};

export default function SpecialRequestsManager() {
  const [rows, setRows] = useState<SpecialRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [edit, setEdit] = useState<Record<number, { quotedPrice: string; etaDays: string; adminNote: string }>>({});

  const load = useCallback(async () => {
    const d = await fetch("/api/special-requests", { cache: "no-store" }).then((r) => r.json());
    setRows(d.requests ?? []);
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/special-requests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setBusy(false);
    load();
  }

  const list = filter ? rows.filter((r) => r.status === filter) : rows;
  const open = rows.filter((r) => !["delivered", "closed"].includes(r.status)).length;

  return (
    <div className="mt-6 space-y-4">
      <div className="panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black text-gold2">🌍 الطلبات الخاصة والاستيراد</h3>
          <span className="rounded-lg bg-gold/12 px-2.5 py-1 text-[11px] font-black text-gold2">
            {open} طلب مفتوح من {rows.length}
          </span>
        </div>
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
          <button onClick={() => setFilter("")} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${!filter ? "btn-gold" : "chip"}`}>الكل ({rows.length})</button>
          {FLOW.map((f) => {
            const n = rows.filter((r) => r.status === f.k).length;
            if (!n) return null;
            return (
              <button key={f.k} onClick={() => setFilter(f.k)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${filter === f.k ? "btn-gold" : "chip"}`}>
                {f.l} ({n})
              </button>
            );
          })}
        </div>
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">لا توجد طلبات</div>
      )}

      {list.map((r) => {
        const e = edit[r.id] ?? {
          quotedPrice: r.quotedPrice?.toString() ?? "",
          etaDays: r.etaDays?.toString() ?? "",
          adminNote: r.adminNote ?? "",
        };
        const set = (k: string, v: string) => setEdit({ ...edit, [r.id]: { ...e, [k]: v } });
        return (
          <div key={r.id} className="panel rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] text-gold2">{r.refNo}</span>
                  <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] font-bold">{SECTOR_AR[r.sector] ?? r.sector}</span>
                  {r.urgency === "urgent" && <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">⚡ عاجل</span>}
                  <span className="text-[10px] text-white/40">{new Date(r.createdAt).toLocaleString("ar-SA")}</span>
                </div>
                <div className="mt-1 text-sm font-black">
                  {r.itemName} {r.brand && `· ${r.brand}`} {r.model && `(${r.model})`} × {r.quantity}
                </div>
                <div className="text-[11px] text-white/55">
                  {r.customerName} · {r.phone} · {r.city} · المصدر المطلوب: {r.sourceCountry}
                  {r.budget ? ` · ميزانية العميل: ${formatSAR(r.budget)}` : ""}
                </div>
                {r.specs && <p className="mt-1.5 rounded-lg bg-bg p-2 text-[11px] text-white/70">{r.specs}</p>}
              </div>
              <select value={r.status} onChange={(ev) => patch(r.id, { status: ev.target.value })}
                className="input !w-auto !py-1.5 text-xs">
                {FLOW.map((f) => <option key={f.k} value={f.k}>{f.l}</option>)}
              </select>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <input className="input !py-2 text-xs" type="number" placeholder="عرض السعر (ر.س)" value={e.quotedPrice} onChange={(ev) => set("quotedPrice", ev.target.value)} />
              <input className="input !py-2 text-xs" type="number" placeholder="مدة التوريد (يوم)" value={e.etaDays} onChange={(ev) => set("etaDays", ev.target.value)} />
              <input className="input !py-2 text-xs" placeholder="ملاحظة للعميل" value={e.adminNote} onChange={(ev) => set("adminNote", ev.target.value)} />
              <button disabled={busy}
                onClick={() => patch(r.id, { quotedPrice: e.quotedPrice, etaDays: e.etaDays, adminNote: e.adminNote, status: r.status === "new" || r.status === "sourcing" ? "quoted" : r.status })}
                className="btn-gold rounded-xl px-4 text-xs disabled:opacity-60">
                حفظ وإرسال العرض
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`https://wa.me/${r.phone.replace(/^0/, "966")}`} target="_blank" rel="noreferrer"
                className="rounded-lg bg-[#25D366]/15 px-3 py-1.5 text-[11px] font-bold text-[#25D366]">💬 واتساب العميل</a>
              <a href={`tel:${r.phone}`} className="rounded-lg bg-white/8 px-3 py-1.5 text-[11px] font-bold">📞 اتصال</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
