"use client";

import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

declare global {
  interface Window {
    __najeebInstallPrompt?: BIP;
  }
}

const SW_VERSION = "najeeb-v6";

export default function PwaRegister() {
  const [prompt, setPrompt] = useState<BIP | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        // Self-heal: if an older SW version is installed, purge caches and replace it.
        const stored = localStorage.getItem("lx_sw_version");
        if (stored !== SW_VERSION) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          localStorage.setItem("lx_sw_version", SW_VERSION);
        }

        const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        reg.update().catch(() => {});

        // Activate a waiting worker immediately instead of waiting for all tabs to close.
        if (reg.waiting) reg.waiting.postMessage("skipWaiting");
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) sw.postMessage("skipWaiting");
          });
        });
      } catch {
        /* SW is an enhancement only — never block the app */
      }
    })();

    // If the browser regains connectivity while showing a cached page, refresh once.
    const onOnline = () => {
      if (document.visibilityState === "visible" && window.location.pathname === "/offline") {
        window.location.replace("/");
      }
    };
    window.addEventListener("online", onOnline);

    const onBip = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BIP;
      window.__najeebInstallPrompt = installEvent;
      setPrompt(installEvent);
      window.dispatchEvent(new Event("najeeb-install-available"));
      if (!localStorage.getItem("lx_pwa_dismissed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!show || !prompt) return null;
  return (
    <div className="fade-up fixed bottom-28 left-3 right-3 z-40 mx-auto max-w-sm rounded-2xl border border-gold/40 bg-panel/97 p-3 shadow-2xl backdrop-blur md:bottom-24 md:left-auto md:right-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📲</span>
        <div className="flex-1">
          <div className="text-sm font-black">ثبّت التطبيق على جهازك</div>
          <div className="text-[10px] text-white/55">وصول أسرع ودعم العمل دون اتصال</div>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={async () => { await prompt.prompt(); setShow(false); }} className="btn-gold flex-1 rounded-lg py-2 text-xs">تثبيت الآن</button>
        <button onClick={() => { localStorage.setItem("lx_pwa_dismissed", "1"); setShow(false); }} className="btn-ghost rounded-lg px-3 text-xs font-bold">لاحقاً</button>
      </div>
    </div>
  );
}
