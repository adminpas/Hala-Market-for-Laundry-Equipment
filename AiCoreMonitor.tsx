"use client";

import { useCallback, useEffect, useState } from "react";

type Node = { key: string; name: string; scope: string; status: "active" | "idle"; detail: string; signals: number };
type Insight = { level: "info" | "warn" | "critical"; title: string; detail: string; action: string };
type Core = {
  health: number; engine: string; nodes: Node[]; activeNodes: number; totalNodes: number;
  insights: Insight[];
  stats: Record<string, number>;
  generatedAt: string;
};

const LEVEL: Record<string, { c: string; i: string }> = {
  critical: { c: "border-red-500/40 bg-red-500/10 text-red-300", i: "🚨" },
  warn: { c: "border-amber-500/35 bg-amber-500/10 text-amber-300", i: "⚠️" },
  info: { c: "border-white/12 bg-bg text-white/70", i: "ℹ️" },
};

const STAT_AR: Record<string, string> = {
  products: "المعدات", categories: "الأقسام", customers: "العملاء", orders: "الطلبات",
  auctions: "المزادات", bids: "العروض السرية", specialRequests: "طلبات التوريد",
  tickets: "تذاكر الصيانة", securityEvents: "أحداث الأمن",
};

export default function AiCoreMonitor() {
  const [d, setD] = useState<Core | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/ai-core", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (r && !r.error) setD(r);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, 25000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  if (!d) return <div className="mt-6 text-center text-white/40">جاري تحميل النواة الذكية...</div>;
  const color = d.health >= 85 ? "#10b981" : d.health >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        <div className="panel rounded-2xl p-5 text-center">
          <div className="text-xs text-white/50">صحة النواة الذكية</div>
          <div className="relative mx-auto mt-3 h-32 w-32">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${d.health} 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{ color }}>{d.health}</span>
              <span className="text-[10px] text-white/45">من 100</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] font-black text-gold2">{d.activeNodes}/{d.totalNodes} وحدة ذكاء نشطة</div>
          <div className="mt-1 text-[10px] text-white/45">{d.engine}</div>
        </div>

        <div className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">🧠 رؤى النواة المركزية</h3>
          <div className="mt-3 space-y-2">
            {d.insights.map((x, i) => (
              <div key={i} className={`rounded-xl border p-3 ${LEVEL[x.level].c}`}>
                <div className="text-[12.5px] font-black">{LEVEL[x.level].i} {x.title}</div>
                <div className="mt-0.5 text-[11px] text-white/70">{x.detail}</div>
                {x.action !== "—" && <div className="mt-1 text-[10px] font-bold text-gold2">← {x.action}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel rounded-2xl p-5">
        <h3 className="font-black text-gold2">⚡ وحدات الذكاء في النظام</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {d.nodes.map((n) => (
            <div key={n.key} className="rounded-xl bg-bg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black">{n.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-black ${n.status === "active" ? "bg-price/20 text-price" : "bg-white/8 text-white/45"}`}>
                  {n.status === "active" ? "● نشط" : "○ خامل"}
                </span>
              </div>
              <div className="mt-0.5 text-[9.5px] text-gold2">{n.scope}</div>
              <div className="mt-1 text-[10.5px] leading-snug text-white/60">{n.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel rounded-2xl p-5">
        <h3 className="font-black text-gold2">📊 مؤشرات المنصة اللحظية</h3>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {Object.entries(d.stats).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-bg p-2.5 text-center">
              <div className="text-[9px] text-white/45">{STAT_AR[k] ?? k}</div>
              <div className="mt-0.5 text-sm font-black text-white">{v.toLocaleString("en-US")}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-left text-[9px] text-white/35">آخر تحديث: {new Date(d.generatedAt).toLocaleTimeString("ar-SA")} · يُحدَّث كل 25 ثانية</div>
      </div>
    </div>
  );
}
