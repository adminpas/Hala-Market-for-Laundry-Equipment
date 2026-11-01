"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function AdminInstallClient() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
      setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    }, 0);

    navigator.serviceWorker?.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(() => navigator.serviceWorker.ready).then(() => setReady(true)).catch(() => setReady(false));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as PromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-8">
      <div className="panel panel-glow rounded-3xl p-7 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/admin-icon-192.png" alt="" className="mx-auto h-24 w-24 rounded-3xl shadow-2xl shadow-gold/20" />
        <p className="mt-4 text-xs font-black tracking-[.28em] text-gold2">ADMIN MINI APP</p>
        <h1 className="mt-1 text-2xl font-black">🎛️ تثبيت لوحة تحكم النظام</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
          تطبيق مصغر يفتح مباشرة على لوحة المدير لإدارة المنتجات والأسعار والوسائط والأقسام والحجوزات والمدفوعات والأمن.
        </p>

        {installed ? (
          <div className="mt-5 rounded-xl bg-price/15 p-3 text-sm font-black text-price">✅ أنت تعمل الآن من تطبيق مثبت</div>
        ) : prompt && ready ? (
          <button onClick={install} className="btn-gold pulse-gold mt-5 w-full rounded-xl py-4 text-base">📲 تثبيت لوحة تحكم النظام الآن</button>
        ) : ios ? (
          <div className="mt-5 rounded-xl border border-gold/25 bg-gold/8 p-4 text-right text-sm leading-7 text-white/75">
            <b className="text-gold2">على iPhone/iPad:</b><br />
            1. افتح هذه الصفحة في Safari.<br />
            2. اضغط مشاركة ⬆️.<br />
            3. اختر «إضافة إلى الشاشة الرئيسية».<br />
            4. اضغط «إضافة».
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-200">
            {ready ? "إن لم يظهر زر التثبيت، افتح قائمة المتصفح ⋮ واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»." : "جارٍ تجهيز التثبيت... تأكد من فتح الرابط عبر HTTPS ثم أعد تحميل الصفحة."}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
          <div className="rounded-xl bg-bg p-3">📦 إدارة المعدات</div>
          <div className="rounded-xl bg-bg p-3">📱 رفع من الجوال</div>
          <div className="rounded-xl bg-bg p-3">🏦 المال والمدفوعات</div>
          <div className="rounded-xl bg-bg p-3">🛡️ الأمن والذكاء</div>
        </div>

        <Link href="/admin" className="btn-ghost mt-5 block rounded-xl py-3 text-sm font-bold">← العودة إلى لوحة المدير</Link>
      </div>
    </div>
  );
}
