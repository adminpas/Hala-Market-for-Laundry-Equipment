"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Check = { group: string; name: string; pass: boolean; detail: string };
type Report = {
  score: number; passed: number; total: number;
  groups: { group: string; passed: number; total: number }[];
  checks: Check[];
  productionReady: boolean;
  generatedAt: string;
};
type RouteRes = { path: string; status: number; ms: number; ok: boolean; kind: string };

/** Every page + API the platform exposes. */
const PAGES = ["/", "/market", "/cart", "/account", "/dashboard", "/maintenance", "/admin", "/system", "/offline", "/section/boilers", "/section/press-shirt"];
const APIS = ["/api/health", "/api/products", "/api/products?status=1", "/api/categories", "/api/services", "/api/site-settings", "/api/ads", "/api/news", "/api/ai", "/api/payment-settings", "/api/customer", "/api/cart"];
const GUARDED = ["/api/security", "/api/upload", "/api/system-check"];

export default function SystemCheckClient() {
  const [rep, setRep] = useState<Report | null>(null);
  const [routes, setRoutes] = useState<RouteRes[]>([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");

  const run = useCallback(async () => {
    setBusy(true);
    setRoutes([]);
    setPhase("فحص الوحدات والبيانات...");
    try {
      const r = await fetch("/api/system-check", { cache: "no-store" }).then((x) => x.json());
      if (!r.error) setRep(r);
    } catch {}

    setPhase("فحص جميع الصفحات والمسارات...");
    const out: RouteRes[] = [];
    const probe = async (path: string, kind: string) => {
      const t0 = performance.now();
      try {
        const res = await fetch(path, { cache: "no-store" });
        out.push({ path, status: res.status, ms: Math.round(performance.now() - t0), ok: res.ok, kind });
      } catch {
        out.push({ path, status: 0, ms: Math.round(performance.now() - t0), ok: false, kind });
      }
      setRoutes([...out]);
    };
    for (const p of PAGES) await probe(p, "صفحة");
    for (const a of APIS) await probe(a, "API");
    for (const g of GUARDED) await probe(g, "محمي");
    setPhase("");
    setBusy(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(run, 0);
    return () => clearTimeout(id);
  }, [run]);

  const routesOk = routes.filter((r) => r.ok).length;
  const allScore = rep ? Math.round(((rep.passed + routesOk) / (rep.total + routes.length || 1)) * 100) : 0;
  const color = allScore >= 95 ? "#10b981" : allScore >= 80 ? "#eab308" : "#ef4444";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.3em] text-gold2">PRE-LAUNCH SYSTEM CHECK</p>
          <h1 className="text-2xl font-black md:text-3xl">🧪 الفحص الشامل للنظام</h1>
          <p className="mt-1 text-xs text-white/55">نسخة موحدة تفحص كل ملف ووحدة وصفحة ومسار قبل الإطلاق.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={run} disabled={busy} className="btn-gold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
            {busy ? "⏳ جاري الفحص..." : "🔄 إعادة الفحص"}
          </button>
          <Link href="/admin" className="btn-ghost rounded-xl px-4 py-2.5 text-sm font-bold">لوحة المالك</Link>
        </div>
      </div>

      {phase && <div className="mt-3 rounded-lg bg-gold/10 px-3 py-2 text-xs font-bold text-gold2">{phase}</div>}

      {/* overall gauge */}
      <div className="mt-5 grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="panel rounded-2xl p-5 text-center">
          <div className="text-xs text-white/50">الجاهزية الإجمالية</div>
          <div className="relative mx-auto mt-3 h-32 w-32">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${allScore} 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{ color }}>{allScore}%</span>
              <span className="text-[10px] text-white/45">{(rep?.passed ?? 0) + routesOk}/{(rep?.total ?? 0) + routes.length}</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-black" style={{ color }}>
            {rep?.productionReady
              ? "✅ جاهز للإطلاق التجاري"
              : allScore >= 80
                ? "🧪 صالح للتجربة — الإطلاق غير مكتمل"
                : "🚨 توجد مشاكل"}
          </div>
          {rep && !rep.productionReady && (
            <div className="mt-1 text-[9.5px] leading-snug text-amber-300">
              راجع مجموعة «جاهزية الإطلاق» أدناه
            </div>
          )}
        </div>

        <div className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">📊 ملخص الوحدات</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rep?.groups.map((g) => {
              const pct = Math.round((g.passed / g.total) * 100);
              return (
                <div key={g.group} className="rounded-xl bg-bg p-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{g.group}</span>
                    <span className={pct === 100 ? "text-price" : "text-amber-300"}>{g.passed}/{g.total}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#eab308" }} />
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl bg-bg p-3">
              <div className="flex justify-between text-xs font-bold">
                <span>الصفحات والمسارات</span>
                <span className={routesOk === routes.length && routes.length ? "text-price" : "text-amber-300"}>{routesOk}/{routes.length}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-price" style={{ width: `${routes.length ? (routesOk / routes.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* detailed checks */}
      {rep && (
        <div className="mt-5 space-y-4">
          {rep.groups.map((g) => (
            <div key={g.group} className="panel rounded-2xl p-4">
              <h3 className="font-black text-gold2">{g.group} <span className="text-[11px] font-normal text-white/45">({g.passed}/{g.total})</span></h3>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {rep.checks.filter((c) => c.group === g.group).map((c) => (
                  <div key={c.name} className={`flex items-start justify-between gap-2 rounded-lg p-2.5 text-xs ${c.pass ? "bg-bg" : "bg-red-500/10 ring-1 ring-red-500/30"}`}>
                    <span className="font-bold">{c.pass ? "✅" : "❌"} {c.name}</span>
                    <span className="shrink-0 text-left text-[10px] text-white/45">{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* route matrix */}
      <div className="panel mt-4 rounded-2xl p-4">
        <h3 className="font-black text-gold2">🔗 مصفوفة الصفحات والمسارات ({routesOk}/{routes.length})</h3>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => {
            const good = r.kind === "محمي" ? r.status === 200 || r.status === 401 : r.ok;
            return (
              <div key={r.path} className={`flex items-center justify-between rounded-lg p-2 text-[11px] ${good ? "bg-bg" : "bg-red-500/10 ring-1 ring-red-500/30"}`}>
                <span className="truncate font-mono">{good ? "✅" : "❌"} {r.path}</span>
                <span className="shrink-0 text-white/45">{r.status} · {r.ms}ms</span>
              </div>
            );
          })}
          {routes.length === 0 && <div className="col-span-full py-4 text-center text-xs text-white/40">جاري الفحص...</div>}
        </div>
      </div>

      <div className="panel mt-4 rounded-2xl p-4 text-xs text-white/60">
        <h3 className="font-black text-gold2">📋 قبل الإطلاق الرسمي</h3>
        <ul className="mt-2 space-y-1">
          <li>• غيّر كلمة مرور المالك من متغير البيئة <span className="font-mono text-gold2">ADMIN_PASSWORD</span>.</li>
          <li>• أدخل بيانات الحساب البنكي الحقيقي من تبويب «حساب التحصيل».</li>
          <li>• اربط بوابة دفع فعلية (Moyasar / HyperPay) لتحصيل حقيقي.</li>
          <li>• ارفع صور وفيديوهات معداتك الحقيقية من تبويب «المنتجات» أو «الوسائط».</li>
          <li>• لتفعيل ذكاء اصطناعي متقدم أضف <span className="font-mono text-gold2">OPENAI_API_KEY</span>.</li>
        </ul>
      </div>
    </div>
  );
}
