"use client";

import type { PublicProduct } from "@/lib/data";
import { CONDITION_LABEL, CONDITION_META, capacityBadge, formatSAR, posterFx } from "@/lib/catalog";
import type { ConditionKey } from "@/db/schema";
import SmartImage from "./SmartImage";

export function ConditionBadge({ condition }: { condition: ConditionKey }) {
  const m = CONDITION_META[condition] ?? CONDITION_META.new;
  return (
    <span className="rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide shadow-lg"
      style={{ background: m.bg, color: m.color }}>
      {CONDITION_LABEL[condition]}
    </span>
  );
}

export function ReservedBadge({ small }: { small?: boolean }) {
  return (
    <span className={`badge-flash rounded-md bg-red-600 font-black text-white ${small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm"}`}>
      ⏳ محجوز مؤقتاً
    </span>
  );
}

export function ratingOf(p: { id: number; guaranteeMonths: number }) {
  return (7.4 + ((p.id * 7) % 25) / 10 + (p.guaranteeMonths >= 12 ? 0.2 : 0)).toFixed(1).slice(0, 3);
}

/** Quality tag like 4K UHD / HD shown on streaming posters. */
export function qualityOf(p: { id: number; condition: string }) {
  return p.condition === "new" || p.id % 3 === 0 ? "4K" : "HD";
}

export default function ProductCard({
  product,
  onOpen,
  rank,
  favorite,
  onFavorite,
}: {
  product: PublicProduct;
  onOpen: (p: PublicProduct) => void;
  rank?: number;
  favorite?: boolean;
  onFavorite?: (id: number) => void;
}) {
  const rating = ratingOf(product);
  const q = qualityOf(product);

  return (
    <div className={`group relative shrink-0 snap-start ${rank ? "flex items-end" : ""}`}>
      {/* big rank number behind the poster (Top 10 style) */}
      {rank && (
        <span className="rank-num pointer-events-none -ml-4 select-none text-[86px] font-black leading-[0.72] sm:-ml-5 sm:text-[104px]">
          {rank}
        </span>
      )}

      <button
        onClick={() => onOpen(product)}
        className="card relative w-[126px] overflow-hidden rounded-xl bg-panel text-right sm:w-[150px] md:w-[168px]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-panel2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.nameAr}
            loading="lazy"
            style={posterFx(product.id)}
            className="h-full w-full object-cover transition duration-700 group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/45" />

          {/* top row: quality + rating */}
          <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between">
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-black text-gold2 backdrop-blur">{q}</span>
            <span className="flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-black text-amber-400 backdrop-blur">
              {rating} ★
            </span>
          </div>

          {/* condition ribbon */}
          <span className="absolute right-0 top-8 rounded-l-md px-2 py-0.5 text-[9px] font-black shadow"
            style={{ background: CONDITION_META[product.condition]?.bg, color: CONDITION_META[product.condition]?.color }}>
            {CONDITION_LABEL[product.condition]}
          </span>

          {product.reserved && (
            <span className="badge-flash absolute right-1 top-14 rounded bg-red-700 px-1.5 py-0.5 text-[9px] font-black text-white">محجوز</span>
          )}
          {product.isSold && (
            <span className="absolute right-1 top-14 rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-black text-bg">مباع</span>
          )}

          {/* hover play */}
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/95 text-xl text-bg shadow-2xl">▶</span>
          </span>

          {/* bottom: price + capacity */}
          <div className="absolute inset-x-1.5 bottom-1.5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white/85 backdrop-blur">
                {capacityBadge(product.category, product.capacityKg)}
              </span>
              <span className="rounded bg-price/90 px-1.5 py-0.5 text-[11px] font-black text-bg">{formatSAR(product.price)}</span>
            </div>
          </div>
        </div>

        {/* meta under poster */}
        <div className="px-1 pb-2 pt-1.5">
          <h3 className="truncate text-[11px] font-bold text-white/90 sm:text-[12px]">{product.nameAr}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-white/45">
            <span>{product.originAr}</span>
            <span>•</span>
            <span className="truncate">{product.subcategoryAr.split(" (")[0]}</span>
          </div>
        </div>
      </button>

      {/* favourite star */}
      {onFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(product.id); }}
          aria-label="إضافة لقائمتي"
          className={`absolute bottom-11 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] backdrop-blur transition ${
            favorite ? "border-gold bg-gold text-bg" : "border-white/25 bg-black/60 text-white/80 opacity-0 group-hover:opacity-100"
          }`}
        >
          {favorite ? "✓" : "☆"}
        </button>
      )}
    </div>
  );
}
