import { LEGAL_REVIEW_NOTICE, LEGAL_SECTIONS, LEGAL_VERSION } from "@/lib/legal";
import { BRAND, DEVELOPER } from "@/lib/brand";

export const metadata = {
  title: "الشروط والسياسات القانونية",
  description: "شروط البيع والحجز والخصوصية والمزاد والضمان لمنصة شركة النجيب المتطورة.",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="panel panel-glow rounded-2xl p-6">
        <p className="text-xs font-black tracking-[0.3em] text-gold2">LEGAL & COMPLIANCE</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">⚖️ الشروط والسياسات القانونية</h1>
        <p className="mt-2 text-sm text-white/60">{BRAND.fullName}</p>
        <p className="mt-1 text-[10px] text-white/35">الإصدار: {LEGAL_VERSION} · تطوير النظام: {DEVELOPER.company}</p>
        <div className="mt-4 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          ⚠️ {LEGAL_REVIEW_NOTICE}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {LEGAL_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="panel scroll-mt-32 rounded-2xl p-5">
            <h2 className="text-lg font-black text-gold2">{section.icon} {section.title}</h2>
            <div className="mt-3 space-y-2">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="rounded-xl bg-bg p-3 text-sm leading-7 text-white/72">{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
