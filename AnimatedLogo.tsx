"use client";

import { useEffect, useState } from "react";

/**
 * Full official transparent logo: mark, blue water splash, company name,
 * "معدات المغاسل" plaque and tagline move as one single object.
 */
export default function AnimatedLogo({ compact = false }: { compact?: boolean }) {
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    if (compact || sessionStorage.getItem("najeeb-logo-intro") === "played") return;
    sessionStorage.setItem("najeeb-logo-intro", "played");
    const start = setTimeout(() => setIntro(true), 120);
    const finish = setTimeout(() => setIntro(false), 4300);
    return () => {
      clearTimeout(start);
      clearTimeout(finish);
    };
  }, [compact]);

  return (
    <span
      className={`official-logo-wrap relative inline-flex items-center justify-center ${intro ? "official-logo-flight" : ""}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/najeeb-brand-full.svg"
        alt=""
        className={
          compact
            ? "official-logo h-24 w-32 object-contain"
            : "official-logo h-52 w-[310px] object-contain sm:h-60 sm:w-[380px] md:h-64 md:w-[430px]"
        }
      />
      <span className="official-logo-spark pointer-events-none absolute right-[19%] top-[8%] h-2 w-2 rounded-full bg-white" />
    </span>
  );
}
