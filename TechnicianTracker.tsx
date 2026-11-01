"use client";

import { useEffect, useState } from "react";

const STEPS: Record<string, number> = { new: 0, accepted: 1, assigned: 2, en_route: 3, in_progress: 4, done: 5 };
const LABELS = ["تم الاستلام", "تم القبول", "تعيين الفني", "الفني في الطريق", "جاري الإصلاح", "مكتمل"];

export default function TechnicianTracker({
  status,
  technician,
  etaMinutes,
  serviceType,
  createdAt,
}: {
  status: string;
  technician: { name: string; phone: string; rating: number } | null;
  etaMinutes: number | null;
  serviceType: "field" | "workshop";
  createdAt: string;
}) {
  const step = STEPS[status] ?? 0;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "done" || status === "in_progress") {
      const id = setTimeout(() => setProgress(100), 0);
      return () => clearTimeout(id);
    }
    if (step < 2) {
      const id = setTimeout(() => setProgress(0), 0);
      return () => clearTimeout(id);
    }
    const start = new Date(createdAt).getTime();
    const total = (etaMinutes ?? 60) * 60 * 1000;
    const tick = () => setProgress(Math.min(96, Math.max(6, ((Date.now() - start) / total) * 100)));
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [status, step, etaMinutes, createdAt]);

  const x = 40 + (progress / 100) * 420;
  const y = 130 - Math.sin((progress / 100) * Math.PI) * 60;
  const remaining = etaMinutes ? Math.max(0, Math.round(etaMinutes * (1 - progress / 100))) : null;

  return (
    <div className="rounded-2xl border border-white/5 bg-bg p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {LABELS.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 font-bold ${i <= step ? "bg-gold text-bg" : "bg-white/5 text-white/40"}`}>{l}</span>
            {i < LABELS.length - 1 && <span className={`h-px w-3 ${i < step ? "bg-gold" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {serviceType === "field" && step >= 2 && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <svg viewBox="0 0 500 180" className="w-full rounded-xl bg-panel2">
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M25 0H0V25" fill="none" stroke="rgba(255,255,255,0.05)" />
              </pattern>
            </defs>
            <rect width="500" height="180" fill="url(#grid)" />
            <path d="M40 130 Q 250 10 460 130" fill="none" stroke="rgba(197,160,89,0.25)" strokeWidth="6" strokeLinecap="round" />
            <path d="M40 130 Q 250 10 460 130" fill="none" stroke="#c5a059" strokeWidth="3" strokeDasharray="8 6" className="route-line" />
            <circle cx="40" cy="130" r="8" fill="#c5a059" />
            <text x="40" y="160" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="700">مستودع جدة</text>
            <circle cx="460" cy="130" r="8" fill="#10b981" />
            <text x="460" y="160" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="700">موقع المغسلة</text>
            <g style={{ transition: "transform 1s ease" }} transform={`translate(${x} ${y})`}>
              <circle r="16" fill="rgba(197,160,89,0.2)" className="animate-ping" />
              <circle r="12" fill="#0f1115" stroke="#c5a059" strokeWidth="2" />
              <text y="5" fontSize="14" textAnchor="middle">🚛</text>
            </g>
          </svg>
          <div className="space-y-2 text-sm">
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-[11px] text-white/45">الفني المكلف</div>
              <div className="font-black">{technician?.name ?? "—"}</div>
              <div className="text-xs text-white/60">⭐ {technician?.rating ?? "—"} · {technician?.phone}</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-[11px] text-white/45">الوقت المتوقع للوصول</div>
              <div className="text-2xl font-black text-price">{status === "done" ? "وصل ✓" : status === "in_progress" ? "في الموقع" : remaining !== null ? `${remaining} دقيقة` : "—"}</div>
            </div>
            {technician && (
              <a href={`tel:${technician.phone}`} className="btn-ghost block rounded-xl py-2 text-center text-xs font-bold">📞 الاتصال بالفني</a>
            )}
          </div>
        </div>
      )}
      {serviceType === "workshop" && step >= 1 && (
        <div className="mt-3 rounded-xl bg-panel2 p-3 text-sm text-white/70">🏢 الماكينة في ورش الشركة بجدة — سيتم إرسال تقرير الفحص وموعد التسليم عبر واتساب.</div>
      )}
    </div>
  );
}
