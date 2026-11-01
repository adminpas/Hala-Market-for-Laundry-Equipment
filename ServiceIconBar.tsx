"use client";

import Link from "next/link";
import type { UiService } from "@/lib/taxonomy";

/** Horizontal bar of animated section & service icons. */
export default function ServiceIconBar({ services = [] }: { services?: UiService[] }) {
  const SERVICE_ICONS = services;
  if (SERVICE_ICONS.length === 0) return null;
  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-panel/80 to-transparent">
      <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-8">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 sm:justify-center sm:gap-4">
          {SERVICE_ICONS.map((s, idx) => (
            <Link
              key={s.key}
              href={s.href}
              className="svc group flex w-[68px] shrink-0 flex-col items-center gap-1.5 sm:w-[82px]"
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              <span
                className="svc-icon relative flex h-12 w-12 items-center justify-center rounded-full text-xl sm:h-14 sm:w-14 sm:text-2xl"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${s.color}33, ${s.color}12)`,
                  border: `1px solid ${s.color}55`,
                  boxShadow: `0 6px 18px -8px ${s.color}88`,
                }}
              >
                <span className="svc-emoji">{s.icon}</span>
                <span className="svc-ring absolute inset-0 rounded-full" style={{ border: `1.5px solid ${s.color}` }} />
                {s.kind === "service" && (
                  <span
                    className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg"
                    style={{ background: s.color }}
                  />
                )}
              </span>
              <span className="text-center text-[9.5px] font-bold leading-tight text-white/70 transition group-hover:text-white sm:text-[11px]">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
