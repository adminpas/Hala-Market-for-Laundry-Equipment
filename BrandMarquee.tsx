"use client";

import { BRAND } from "@/lib/brand";

/**
 * Global promise banner shown on every page, directly under the brand block.
 * Scrolls continuously and pauses on hover so the text stays readable.
 */
export default function BrandMarquee() {
  const promise = BRAND.promise;
  const segments = BRAND.serviceSegments.join("  ✦  ");

  return (
    <div className="relative overflow-hidden border-y border-gold/25 bg-gradient-to-l from-gold/12 via-gold/5 to-gold/12">
      <div className="brand-marquee flex items-center gap-10 py-1.5">
        {[0, 1].map((dup) => (
          <span key={dup} className="flex shrink-0 items-center gap-10 whitespace-nowrap">
            <span className="flex items-center gap-2 text-[11.5px] font-black text-gold2 sm:text-[13.5px]">
              <span className="marquee-spark">✦</span>
              {promise}
            </span>
            <span className="flex items-center gap-2 text-[11px] font-bold text-white/85 sm:text-[12.5px]">
              <span className="marquee-spark">🧺</span>
              {segments}
            </span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-bg to-transparent" />
    </div>
  );
}
