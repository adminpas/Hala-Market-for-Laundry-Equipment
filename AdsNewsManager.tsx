"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ad, NewsItem } from "@/db/schema";

const KINDS = [
  { k: "news", l: "📰 خبر" },
  { k: "alert", l: "⚠️ تنبيه" },
  { k: "offer", l: "🎁 عرض" },
  { k: "info", l: "ℹ️ معلومة" },
];

const PRESETS = [
  { name: "ذهبي", bgFrom: "#241a06", bgTo: "#0f1115", accent: "#c5a059" },
  { name: "أخضر", bgFrom: "#06231c", bgTo: "#0f1115", accent: "#10b981" },
  { name: "أزرق", bgFrom: "#0a1a2e", bgTo: "#0f1115", accent: "#3b82f6" },
  { name: "بنفسجي", bgFrom: "#1b0a22", bgTo: "#0f1115", accent: "#a855f7" },
  { name: "برتقالي", bgFrom: "#2a1204", bgTo: "#0f1115", accent: "#f97316" },
  { name: "أحمر", bgFrom: "#2a0810", bgTo: "#0f1115", accent: "#ef4444" },
];

const emptyAd = {
  title: "", subtitle: "", advertiser: "", imageUrl: "", linkUrl: "",
  ctaLabel: "اعرف المزيد", badge: "إعلان", sortOrder: 10,
  bgFrom: PRESETS[0].bgFrom, bgTo: PRESETS[0].bgTo, accent: PRESETS[0].accent,
  startsAt: "", endsAt: "",
};

export default function AdsNewsManager({ mode }: { mode: "ads" | "news" }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ ...emptyAd });
  const [editId, setEditId] = useState<number | null>(null);
  const [nForm, setNForm] = useState({ text: "", kind: "news", linkUrl: "", pinned: false, sortOrder: 10 });

  const load = useCallback(async () => {
    if (mode === "ads") {
      const r = await fetch("/api/ads?all=1", { cache: "no-store" }).then((x) => x.json());
      setAds(r.ads ?? []);
    } else {
      const r = await fetch("/api/news?all=1", { cache: "no-store" }).then((x) => x.json());
      setNews(r.news ?? []);
    }
  }, [mode]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function api(url: string, method: string, body?: unknown) {
    setBusy(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error || "خطأ");
      return false;
    }
    await load();
    return true;
  }

  async function saveAd() {
    if (!form.title) return alert("العنوان مطلوب");
    const ok = editId
      ? await api(`/api/ads/${editId}`, "PATCH", form)
      : await api("/api/ads", "POST", form);
    if (ok) {
      setForm({ ...emptyAd });
      setEditId(null);
    }
  }

  if (mode === "news") {
    return (
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="panel h-fit rounded-2xl p-5">
          <h3 className="font-black text-gold2">➕ إضافة خبر / تنبيه</h3>
          <textarea
            rows={3}
            className="input mt-3"
            placeholder="نص الخبر أو التنبيه..."
            value={nForm.text}
            onChange={(e) => setNForm({ ...nForm, text: e.target.value })}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select className="input" value={nForm.kind} onChange={(e) => setNForm({ ...nForm, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k.k} value={k.k}>{k.l}</option>)}
            </select>
            <input className="input" type="number" placeholder="الترتيب" value={nForm.sortOrder} onChange={(e) => setNForm({ ...nForm, sortOrder: Number(e.target.value) })} />
          </div>
          <input className="input mt-2" placeholder="رابط عند الضغط (اختياري)" value={nForm.linkUrl} onChange={(e) => setNForm({ ...nForm, linkUrl: e.target.value })} />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={nForm.pinned} onChange={(e) => setNForm({ ...nForm, pinned: e.target.checked })} className="accent-[#c5a059]" />
            📌 تثبيت في مقدمة الشريط
          </label>
          <button
            disabled={busy}
            onClick={async () => {
              if (!nForm.text) return alert("النص مطلوب");
              if (await api("/api/news", "POST", nForm)) setNForm({ text: "", kind: "news", linkUrl: "", pinned: false, sortOrder: 10 });
            }}
            className="btn-gold mt-3 w-full rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            نشر في شريط الأخبار
          </button>
        </div>

        <div className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">📰 أخبار وتنبيهات المنصة ({news.length})</h3>
          <div className="mt-3 space-y-2">
            {news.map((n) => (
              <div key={n.id} className={`rounded-xl bg-bg p-3 text-sm ${!n.isActive ? "opacity-45" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                      {KINDS.find((k) => k.k === n.kind)?.l}
                    </span>
                    {n.pinned && <span className="mr-1 text-[10px] text-gold2">📌 مثبّت</span>}
                    <div className="mt-1 font-bold text-white/85">{n.text}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => api(`/api/news/${n.id}`, "PATCH", { pinned: !n.pinned })} className="rounded bg-white/5 px-2 py-1 text-[11px] font-bold">
                      {n.pinned ? "إلغاء التثبيت" : "تثبيت"}
                    </button>
                    <button onClick={() => api(`/api/news/${n.id}`, "PATCH", { isActive: !n.isActive })} className="rounded bg-white/5 px-2 py-1 text-[11px] font-bold">
                      {n.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                    <button onClick={() => confirm("حذف الخبر؟") && api(`/api/news/${n.id}`, "DELETE")} className="rounded bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-300">
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {news.length === 0 && <div className="text-sm text-white/40">لا توجد أخبار</div>}
          </div>
        </div>
      </div>
    );
  }

  // ===== ADS =====
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
      <div className="panel h-fit rounded-2xl p-5">
        <h3 className="font-black text-gold2">{editId ? "✏️ تعديل الإعلان" : "➕ إضافة إعلان تجاري"}</h3>
        <input className="input mt-3" placeholder="عنوان الإعلان *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={2} className="input mt-2" placeholder="النص الفرعي" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input className="input" placeholder="اسم المعلن" value={form.advertiser} onChange={(e) => setForm({ ...form, advertiser: e.target.value })} />
          <input className="input" placeholder="شارة (إعلان)" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
          <input className="input" placeholder="نص الزر" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </div>
        <input className="input mt-2" placeholder="رابط الإعلان (https://...)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
        <input className="input mt-2" placeholder="رابط صورة الإعلان (اختياري)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs"><span className="mb-1 block text-white/50">يبدأ في</span>
            <input type="date" className="input" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className="text-xs"><span className="mb-1 block text-white/50">ينتهي في</span>
            <input type="date" className="input" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
        </div>
        <div className="mt-3">
          <div className="text-xs text-white/50">نمط الألوان</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setForm({ ...form, bgFrom: p.bgFrom, bgTo: p.bgTo, accent: p.accent })}
                className={`rounded px-2 py-1 text-[11px] font-bold ${form.accent === p.accent ? "ring-1 ring-white" : ""}`}
                style={{ background: p.bgFrom, color: p.accent, border: `1px solid ${p.accent}66` }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        {/* live preview */}
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10 p-3" style={{ background: `linear-gradient(115deg, ${form.bgFrom}, ${form.bgTo})` }}>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-black" style={{ background: form.accent, color: "#07090d" }}>{form.badge || "إعلان"}</span>
          <div className="mt-1 text-sm font-black">{form.title || "عنوان الإعلان"}</div>
          <div className="text-[11px] text-white/60">{form.subtitle || "النص الفرعي للإعلان"}</div>
          <span className="mt-2 inline-block rounded px-3 py-1 text-[10px] font-black" style={{ background: form.accent, color: "#07090d" }}>{form.ctaLabel} ←</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button disabled={busy} onClick={saveAd} className="btn-gold flex-1 rounded-xl py-2.5 text-sm disabled:opacity-60">
            {editId ? "حفظ التعديل" : "نشر الإعلان"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ ...emptyAd }); }} className="btn-ghost rounded-xl px-4 text-sm font-bold">إلغاء</button>
          )}
        </div>
      </div>

      <div className="panel rounded-2xl p-5">
        <h3 className="font-black text-gold2">📣 الإعلانات التجارية ({ads.length})</h3>
        <div className="mt-3 space-y-2">
          {ads.map((a) => (
            <div key={a.id} className={`rounded-xl p-3 text-sm ${!a.isActive ? "opacity-45" : ""}`} style={{ background: `linear-gradient(115deg, ${a.bgFrom}, ${a.bgTo})` }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-black" style={{ background: a.accent, color: "#07090d" }}>{a.badge}</span>
                  <span className="mr-1 text-[10px] text-white/45">{a.advertiser}</span>
                  <div className="mt-1 font-black">{a.title}</div>
                  <div className="text-[11px] text-white/55">{a.subtitle}</div>
                  <div className="mt-1 flex gap-2 text-[10px] text-white/45">
                    <span>👁️ {a.impressions} ظهور</span>
                    <span>👆 {a.clicks} نقرة</span>
                    <span>ترتيب {a.sortOrder}</span>
                    {a.endsAt && <span>ينتهي {new Date(a.endsAt).toLocaleDateString("ar-SA")}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <button
                    onClick={() => {
                      setEditId(a.id);
                      setForm({
                        title: a.title, subtitle: a.subtitle, advertiser: a.advertiser, imageUrl: a.imageUrl,
                        linkUrl: a.linkUrl, ctaLabel: a.ctaLabel, badge: a.badge, sortOrder: a.sortOrder,
                        bgFrom: a.bgFrom, bgTo: a.bgTo, accent: a.accent,
                        startsAt: a.startsAt ? new Date(a.startsAt).toISOString().slice(0, 10) : "",
                        endsAt: a.endsAt ? new Date(a.endsAt).toISOString().slice(0, 10) : "",
                      });
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold"
                  >
                    تعديل
                  </button>
                  <button onClick={() => api(`/api/ads/${a.id}`, "PATCH", { isActive: !a.isActive })} className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold">
                    {a.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <button onClick={() => confirm("حذف الإعلان؟") && api(`/api/ads/${a.id}`, "DELETE")} className="rounded bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-300">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
          {ads.length === 0 && <div className="text-sm text-white/40">لا توجد إعلانات</div>}
        </div>
      </div>
    </div>
  );
}
