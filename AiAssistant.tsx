"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "ai"; text: string; bullets?: string[] };

const QUICK = [
  "ما المعدات المناسبة لمغسلة 100 كجم يومياً؟",
  "غسالتي تعطي كود E23 ولا تصرف الماء",
  "كم رسوم الشحن والتركيب إلى الرياض؟",
  "ما الفرق بين الغلاية الكهربائية والديزل؟",
];

/** Contextual prompts per section — the assistant knows where you are. */
const SECTION_ASK: Record<string, { name: string; ask: string[] }> = {
  washers: { name: "الغسالات", ask: ["ما السعة المناسبة لمغسلة 200 كجم يومياً؟", "ما الفرق بين Soft Mount و Hard Mount؟"] },
  dryers: { name: "النشافات", ask: ["نشافة غاز أم كهرباء أوفر؟", "ما سعة النشافة المناسبة لغسالة 50 كجم؟"] },
  carpet: { name: "خطوط السجاد", ask: ["ما مكونات خط سجاد متكامل؟", "كم متر مربع ينتج الخط في الساعة؟"] },
  presses: { name: "المكابس", ask: ["مكبس قمصان أم مانجل أفضل؟", "كم إنتاجية مكبس البناطيل؟"] },
  boilers: { name: "المراجل والغلايات", ask: ["ما حجم الغلاية المناسب لـ 3 مكابس؟", "غلاية ديزل أم كهرباء؟"] },
  belts: { name: "السيور المتحركة", ask: ["ما طول السير المناسب لمغسلتي؟", "كيف أزامن السير مع المكواة؟"] },
};

/** Map any route (main / sub / secondary section) to its expert domain. */
function detectSection(path: string): string | undefined {
  const k = decodeURIComponent(path);
  if (/washer|غسال|computer|hotel|ordinary|household/i.test(k)) return "washers";
  if (/dryer|نشاف|\bgas\b|electric|steam/i.test(k)) return "dryers";
  if (/carpet|سجاد|auto-line|centrifuge|dust/i.test(k)) return "carpet";
  if (/press|مكبس|مكابس/i.test(k)) return "presses";
  if (/boiler|غلاي|مرجل|مراجل/i.test(k)) return "boilers";
  if (/belt|سير|سيور/i.test(k)) return "belts";
  // Any future no-code section becomes an AI context automatically.
  const dynamicKey = k.match(/\/section\/([^/?#]+)/)?.[1];
  return dynamicKey || undefined;
}

export default function AiAssistant({ placement = "floating" }: { placement?: "floating" | "header" }) {
  const pathname = usePathname();
  const section = detectSection(pathname);
  const ctx = section ? SECTION_ASK[section] : undefined;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "أهلاً بك 👋 أنا المساعد الذكي لمنصة النجيب المتطورة. كيف أساعدك في اختيار معداتك أو تشخيص عطل؟" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    const task = /عطل|كود|لا تعمل|تسريب|صوت|حرارة|E\d/i.test(text) ? "diagnose" : /مناسب|أنصح|اقترح|باقة|كجم يوم/i.test(text) ? "recommend" : "chat";
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, input: text, meta: section ? { section } : undefined }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "ai", text: d.text, bullets: d.bullets }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "تعذر الاتصال، حاول مرة أخرى." }]);
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="المساعد الذكي"
        title="المساعد الذكي"
        className={
          placement === "header"
            ? "ai-fab ai-fab-header relative z-[55] flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-2xl"
            : "ai-fab fixed bottom-16 right-3 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-2xl md:bottom-5 md:right-5"
        }
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div
          className={
            placement === "header"
              ? "fade-up fixed left-1/2 top-[230px] z-[80] flex h-[min(62vh,560px)] w-[calc(100vw-1rem)] max-w-[400px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-gold/30 bg-panel shadow-2xl"
              : "fade-up fixed bottom-32 right-2 z-50 flex h-[65vh] w-[calc(100vw-1rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-panel shadow-2xl md:bottom-24 md:right-5"
          }
        >
          <div className="flex items-center gap-2 bg-gradient-to-l from-gold to-gold2 px-4 py-2.5 text-bg">
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <div className="text-sm font-black">المساعد الذكي</div>
              <div className="text-[10px] opacity-75">{ctx ? `خبير ${ctx.name} · متاح الآن` : "خبير معدات المغاسل · متاح 24 ساعة"}</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed ${m.role === "user" ? "bg-white/10" : "bg-gold/12 border border-gold/25"}`}>
                  <p>{m.text}</p>
                  {m.bullets && (
                    <ul className="mt-2 space-y-1">
                      {m.bullets.map((b, j) => <li key={j} className="text-[11.5px] text-white/80">• {b}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-end"><div className="rounded-2xl bg-gold/10 px-3 py-2 text-xs text-gold2">يفكر<span className="ai-dots" /></div></div>}
            {msgs.length <= 1 && (
              <div className="space-y-1.5 pt-2">
                {(ctx ? [...ctx.ask, ...QUICK.slice(0, 2)] : QUICK).map((q) => (
                  <button key={q} onClick={() => send(q)} className="block w-full rounded-lg border border-white/10 bg-bg p-2 text-right text-[11px] text-white/70 hover:border-gold/40 hover:text-white">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-white/10 bg-bg p-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب سؤالك..." className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35" />
            <button disabled={busy} className="btn-gold rounded-lg px-4 text-sm disabled:opacity-50">إرسال</button>
          </form>
        </div>
      )}
    </>
  );
}
