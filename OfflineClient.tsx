"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function OfflineClient() {
  const [status, setStatus] = useState<"checking" | "offline" | "back">("checking");
  const [tries, setTries] = useState(0);

  /** Probe the real server instead of trusting the cached page. */
  const probe = useCallback(async () => {
    try {
      const r = await fetch(`/api/health?t=${Date.now()}`, { cache: "no-store" });
      if (r.ok) {
        setStatus("back");
        window.location.replace("/");
        return true;
      }
    } catch {}
    setStatus("offline");
    return false;
  }, []);

  useEffect(() => {
    const first = setTimeout(probe, 0);
    const t = setInterval(() => { setTries((n) => n + 1); probe(); }, 5000);
    window.addEventListener("online", probe);
    return () => { clearTimeout(first); clearInterval(t); window.removeEventListener("online", probe); };
  }, [probe]);

  async function hardReset() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      localStorage.removeItem("lx_sw_version");
    } catch {}
    window.location.replace("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-6xl">{status === "checking" ? "🔄" : "📡"}</div>
      <h1 className="mt-4 text-2xl font-black text-gold2">
        {status === "checking" ? "جاري التحقق من الاتصال..." : status === "back" ? "عاد الاتصال ✓" : "تعذّر الوصول للخادم"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {status === "offline"
          ? "نحاول إعادة الاتصال تلقائياً كل 5 ثوانٍ. إذا استمرت المشكلة اضغط «إصلاح وإعادة التحميل»."
          : "لحظات من فضلك..."}
      </p>
      {tries > 0 && status === "offline" && (
        <p className="mt-1 text-[11px] text-white/35">عدد المحاولات: {tries}</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={probe} className="btn-gold rounded-xl px-6 py-3">إعادة المحاولة الآن</button>
        <button onClick={hardReset} className="btn-ghost rounded-xl px-6 py-3 text-sm font-bold">
          🧹 إصلاح وإعادة التحميل (مسح الذاكرة المؤقتة)
        </button>
        <Link href="/" className="text-xs text-white/45 underline">العودة للرئيسية</Link>
      </div>
    </div>
  );
}
