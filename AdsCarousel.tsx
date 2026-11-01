"use client";

import { useEffect, useRef, useState } from "react";
import type { Ad } from "@/db/schema";

const SLIDE_MS = 5500;

export default function AdsCarousel({ ads }: { ads: Ad[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (ads.length < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % ads.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [ads.length, paused]);

  // count one impression per ad per session
  useEffect(() => {
    const ad = ads[i];
    if (!ad || tracked.current.has(ad.id)) return;
    tracked.current.add(ad.id);
    fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track: "impression", id: ad.id }),
    }).catch(() => {});
  }, [i, ads]);

  if (ads.length === 0) return null;

  function onClickAd(ad: Ad) {
    fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track: "click", id: ad.id }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-8">
      <div
        className="relative overflow-hidden rounded-xl border border-white/10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* label */}
        <span className="absolute left-2 top-2 z-20 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white/60 backdrop-blur">
          مساحة إعلانية
        </span>

        <div className="relative h-[104px] sm:h-[118px] md:h-[130px]">
          {ads.map((ad, idx) => {
            const on = idx === i;
            return (
              <a
                key={ad.id}
                href={ad.linkUrl || "#"}
                target={ad.linkUrl?.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={() => onClickAd(ad)}
                aria-hidden={!on}
                tabIndex={on ? 0 : -1}
                className={`absolute inset-0 flex items-center gap-3 px-4 transition-all duration-700 sm:px-6 ${
                  on ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                }`}
                style={{ background: `linear-gradient(115deg, ${ad.bgFrom} 0%, ${ad.bgTo} 75%)` }}
              >
                {/* animated glow */}
                <span
                  className="ad-glow pointer-events-none absolute inset-0"
                  style={{ background: `radial-gradient(circle at 15% 50%, ${ad.accent}33, transparent 55%)` }}
                />
                {/* shimmer sweep */}
                <span className="ad-sweep pointer-events-none absolute inset-0" />

                {ad.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.imageUrl} alt="" className="relative z-10 h-[72px] w-[96px] shrink-0 rounded-lg object-cover sm:h-[86px] sm:w-[120px]" />
                ) : (
                  <span
                    className="ad-pulse relative z-10 flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-lg text-2xl sm:h-[76px] sm:w-[76px] sm:text-3xl"
                    style={{ background: `${ad.accent}22`, border: `1px solid ${ad.accent}66`, color: ad.accent }}
                  >
                    📣
                  </span>
                )}

                <span className="relative z-10 min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-black"
                      style={{ background: ad.accent, color: "#07090d" }}
                    >
                      {ad.badge}
                    </span>
                    {ad.advertiser && <span className="truncate text-[9px] text-white/45">{ad.advertiser}</span>}
                  </span>
                  <span className="mt-1 block truncate text-[13px] font-black text-white sm:text-[16px]">{ad.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-white/60 sm:text-[12px]">{ad.subtitle}</span>
                </span>

                <span
                  className="relative z-10 hidden shrink-0 rounded-lg px-4 py-2 text-[11px] font-black transition hover:brightness-110 sm:block"
                  style={{ background: ad.accent, color: "#07090d" }}
                >
                  {ad.ctaLabel} ←
                </span>
              </a>
            );
          })}
        </div>

        {/* progress + dots */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
          <div
            key={`${i}-${paused}`}
            className={paused ? "h-full" : "ad-progress h-full"}
            style={{ background: ads[i]?.accent ?? "#c5a059", animationDuration: `${SLIDE_MS}ms` }}
          />
        </div>
        <div className="absolute bottom-2 right-3 z-20 flex gap-1">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`إعلان ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
