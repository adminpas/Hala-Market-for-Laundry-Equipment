"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, SpecField } from "@/db/schema";

const ICONS = ["📦", "🫧", "🔥", "🧶", "♨️", "🔧", "⛓️", "🛏️", "🍽️", "🧊", "🧹", "🚿", "⚙️", "🏨", "🏥", "🧴", "🪣", "🧺"];
const EMPTY = {
  key: "", nameAr: "", nameEn: "", icon: "📦", level: 1, parentKey: "",
  capacityUnit: "كجم", sortOrder: 99, aiInstructions: "", specSchema: [] as SpecField[],
};
const NEW_FIELD: SpecField = { key: "", label: "", type: "text", unit: "", options: [], required: false };

export default function CategoryManager() {
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/categories", { cache: "no-store" }).then((x) => x.json());
    setCats(r.categories ?? []);
  }, []);
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  function reset() {
    setF({ ...EMPTY, specSchema: [] });
    setEditId(null);
  }

  async function save() {
    if (!f.nameAr || (!editId && !f.key)) return alert("المفتاح والاسم مطلوبان");
    if (f.level > 1 && !f.parentKey) return alert("اختر القسم الأب");
    setBusy(true);
    const r = await fetch("/api/categories", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { id: editId, ...f } : f),
    });
    setBusy(false);
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || "خطأ");
    reset();
    load();
  }

  async function patch(id: number, body: Record<string, unknown>) {
    const r = await fetch("/api/categories", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!r.ok) alert((await r.json().catch(() => ({}))).error || "تعذر الحفظ");
    load();
  }

  function edit(c: Category) {
    setEditId(c.id);
    setF({
      key: c.key, nameAr: c.nameAr, nameEn: c.nameEn, icon: c.icon,
      level: c.level, parentKey: c.parentKey ?? "", capacityUnit: c.capacityUnit,
      sortOrder: c.sortOrder, aiInstructions: c.aiInstructions,
      specSchema: (c.specSchema ?? []).map((x) => ({ ...x, options: x.options ?? [] })),
    });
    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  function setSpec(i: number, patch: Partial<SpecField>) {
    setF((prev) => ({
      ...prev,
      specSchema: prev.specSchema.map((row, index) => index === i ? { ...row, ...patch } : row),
    }));
  }

  const mains = cats.filter((c) => c.level === 1);
  const parentOptions = cats.filter((c) => c.level === f.level - 1 && c.isActive);

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.35fr]">
      <div className="panel h-fit rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-gold2">{editId ? "✏️ تعديل القسم" : "➕ إضافة قسم جديد"}</h3>
            <p className="mt-1 text-xs text-white/55">أنشئ الهيكل والمواصفات والذكاء دون تعديل الكود.</p>
          </div>
          {editId && <button onClick={reset} className="btn-ghost rounded-lg px-3 py-1.5 text-[11px] font-bold">إلغاء</button>}
        </div>

        <div className="mt-3 space-y-2">
          <label className="block text-xs"><span className="mb-1 block text-white/50">المستوى</span>
            <select className="input" value={f.level} onChange={(e) => setF({ ...f, level: Number(e.target.value), parentKey: "" })}>
              <option value={1}>قسم رئيسي</option>
              <option value={2}>قسم فرعي (اسم سوقي)</option>
              <option value={3}>قسم ثانوي</option>
            </select>
          </label>

          {f.level > 1 && (
            <label className="block text-xs"><span className="mb-1 block text-white/50">تابع لـ</span>
              <select className="input" value={f.parentKey} onChange={(e) => setF({ ...f, parentKey: e.target.value })}>
                <option value="">— اختر —</option>
                {parentOptions.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.nameAr}</option>)}
              </select>
            </label>
          )}

          <input disabled={!!editId} className="input font-mono disabled:opacity-45" placeholder="المفتاح بالإنجليزية (hotel-linen)" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} />
          <input className="input" placeholder="الاسم بالعربي *" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} />
          <input className="input" placeholder="الاسم بالإنجليزي" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
          {f.level === 1 && (
            <input className="input" placeholder="وحدة السعة (كجم / بوصة / لتر / متر)" value={f.capacityUnit} onChange={(e) => setF({ ...f, capacityUnit: e.target.value })} />
          )}

          <div>
            <div className="text-xs text-white/50">الأيقونة</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {ICONS.map((i) => (
                <button type="button" key={i} onClick={() => setF({ ...f, icon: i })}
                  className={`rounded-lg px-2 py-1 text-lg ${f.icon === i ? "bg-gold/25 ring-1 ring-gold" : "bg-bg"}`}>{i}</button>
              ))}
            </div>
          </div>

          {f.level === 1 && (
            <>
              <div className="mt-3 rounded-xl border border-gold/20 bg-gold/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11.5px] font-black text-gold2">⚙️ حقول المواصفات الديناميكية</div>
                    <div className="text-[9.5px] text-white/45">تظهر تلقائياً عند إضافة وعرض منتجات هذا القسم.</div>
                  </div>
                  <button type="button" onClick={() => setF({ ...f, specSchema: [...f.specSchema, { ...NEW_FIELD }] })}
                    className="rounded-lg bg-gold px-2.5 py-1.5 text-[10px] font-black text-bg">＋ حقل</button>
                </div>

                <div className="mt-2 space-y-2">
                  {f.specSchema.map((row, i) => (
                    <div key={i} className="rounded-lg bg-bg p-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input className="input !py-1.5 text-[10px]" placeholder="المفتاح: pressure" value={row.key} onChange={(e) => setSpec(i, { key: e.target.value })} />
                        <input className="input !py-1.5 text-[10px]" placeholder="الاسم: ضغط التشغيل" value={row.label} onChange={(e) => setSpec(i, { label: e.target.value })} />
                        <select className="input !py-1.5 text-[10px]" value={row.type} onChange={(e) => setSpec(i, { type: e.target.value as SpecField["type"] })}>
                          <option value="text">نص</option><option value="number">رقم</option><option value="select">قائمة خيارات</option><option value="boolean">نعم / لا</option>
                        </select>
                        <input className="input !py-1.5 text-[10px]" placeholder="الوحدة: بار / kW" value={row.unit ?? ""} onChange={(e) => setSpec(i, { unit: e.target.value })} />
                      </div>
                      {row.type === "select" && (
                        <input className="input mt-1.5 !py-1.5 text-[10px]" placeholder="الخيارات مفصولة بفاصلة: ديزل، غاز، كهرباء"
                          value={(row.options ?? []).join(", ")} onChange={(e) => setSpec(i, { options: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} />
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <label className="flex items-center gap-1 text-[10px] text-white/55">
                          <input type="checkbox" checked={!!row.required} onChange={(e) => setSpec(i, { required: e.target.checked })} className="accent-[#c5a059]" /> مطلوب
                        </label>
                        <button type="button" onClick={() => setF({ ...f, specSchema: f.specSchema.filter((_, x) => x !== i) })}
                          className="text-[10px] font-bold text-red-300">حذف الحقل</button>
                      </div>
                    </div>
                  ))}
                  {f.specSchema.length === 0 && <div className="py-2 text-center text-[10px] text-white/35">لا توجد حقول إضافية — يمكنك إضافتها لاحقاً</div>}
                </div>
              </div>

              <label className="block text-xs">
                <span className="mb-1 block text-white/50">🧠 تعليمات الذكاء لهذا القسم</span>
                <textarea rows={3} className="input" placeholder="مثال: ركّز على ضغط التشغيل ونوع الوقود ومعالجة المياه عند تقديم النصائح..."
                  value={f.aiInstructions} onChange={(e) => setF({ ...f, aiInstructions: e.target.value })} />
              </label>
            </>
          )}

          <button disabled={busy} onClick={save} className="btn-gold w-full rounded-xl py-2.5 text-sm disabled:opacity-60">
            {busy ? "جاري الحفظ..." : editId ? "حفظ التعديلات" : "إضافة القسم"}
          </button>
        </div>
      </div>

      <div className="panel rounded-2xl p-5">
        <h3 className="font-black text-gold2">🗂️ شجرة الأقسام ({cats.length})</h3>
        <div className="mt-3 space-y-2">
          {mains.map((m) => {
            const subs = cats.filter((c) => c.level === 2 && c.parentKey === m.key);
            return (
              <div key={m.id} className={`rounded-xl bg-bg p-3 ${!m.isActive ? "opacity-40" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black">{m.icon} {m.nameAr} <span className="font-mono text-[10px] text-white/35">{m.key}</span></div>
                    <div className="mt-0.5 text-[9px] text-white/40">
                      {m.capacityUnit} · {(m.specSchema ?? []).length} حقل ديناميكي {m.aiInstructions ? "· 🧠 ذكاء مخصّص" : ""}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => edit(m)} className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold">تعديل</button>
                    <button onClick={() => patch(m.id, { isActive: !m.isActive })} className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold">{m.isActive ? "إخفاء" : "تفعيل"}</button>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  {subs.map((sub) => {
                    const seconds = cats.filter((c) => c.level === 3 && c.parentKey === sub.key);
                    return (
                      <div key={sub.id} className="rounded-lg border border-white/8 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] ${sub.isActive ? "text-white/75" : "text-white/30 line-through"}`}>{sub.nameAr}</span>
                          <span className="flex gap-1">
                            <button onClick={() => edit(sub)} className="text-[9px] font-bold text-gold2">تعديل</button>
                            <button onClick={() => patch(sub.id, { isActive: !sub.isActive })} className="text-[9px] text-white/45">{sub.isActive ? "إخفاء" : "إظهار"}</button>
                          </span>
                        </div>
                        {seconds.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {seconds.map((sec) => (
                              <span key={sec.id} className={`rounded-full bg-white/5 px-2 py-0.5 text-[9px] ${sec.isActive ? "text-white/60" : "text-white/25 line-through"}`}>
                                {sec.nameAr}
                                <button onClick={() => edit(sec)} className="mr-1 text-gold2">✎</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
