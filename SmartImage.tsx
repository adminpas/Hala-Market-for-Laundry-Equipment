"use client";

import { useState } from "react";
import { blurFor } from "@/lib/blur";

/**
 * Resilient poster image (3 layers, never blank / never flashing white):
 *  1. An inlined base64 micro-thumbnail paints instantly (works offline too).
 *  2. The real photo fades in on top once loaded.
 *  3. If the photo fails, a branded SVG poster is drawn instead.
 */
function fallbackSvg(label: string, icon: string) {
  const safe = label.replace(/[<>&"]/g, "").slice(0, 26);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#161a21"/><stop offset="55%" stop-color="#0f1115"/><stop offset="100%" stop-color="#090b0f"/>
</linearGradient></defs>
<rect width="300" height="450" fill="url(#g)"/>
<circle cx="150" cy="180" r="66" fill="none" stroke="#c5a059" stroke-width="3" opacity="0.55"/>
<circle cx="150" cy="180" r="48" fill="none" stroke="#c5a059" stroke-width="1.5" opacity="0.3"/>
<text x="150" y="200" font-size="54" text-anchor="middle">${icon}</text>
<text x="150" y="300" fill="#c5a059" font-size="17" font-weight="bold" text-anchor="middle" font-family="sans-serif">${safe}</text>
<text x="150" y="330" fill="#6b7280" font-size="12" text-anchor="middle" font-family="sans-serif">النجيب المتطورة</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ICONS: Record<string, string> = {
  washers: "🫧", dryers: "🔥", carpet: "🧶", presses: "♨️", boilers: "🔧",
};

export default function SmartImage({
  src, alt, category = "", className = "", style, loading = "lazy",
}: {
  src: string; alt: string; category?: string; className?: string;
  style?: React.CSSProperties; loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const blur = blurFor(src);

  if (failed || !src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallbackSvg(alt, ICONS[category] ?? "🧺")} alt={alt} className={className} />
    );
  }

  return (
    <span className="absolute inset-0 block">
      {/* instant inlined preview — visible with zero network */}
      {blur && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blur}
          alt=""
          aria-hidden="true"
          className={`${className} absolute inset-0`}
          style={{ filter: "blur(8px)", transform: "scale(1.06)" }}
        />
      )}
      {/* real photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ ...style, opacity: loaded || !blur ? 1 : 0, transition: "opacity .45s ease" }}
        className={`${className} absolute inset-0`}
      />
    </span>
  );
}
