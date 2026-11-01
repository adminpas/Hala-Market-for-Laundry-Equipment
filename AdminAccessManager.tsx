"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AssistantManager from "./AssistantManager";

type State = {
  username: string;
  sessionVersion: number;
  passwordChangedAt: string;
  configuration: {
    customPassword: boolean;
    customSessionSecret: boolean;
    hostRestricted: boolean;
    networkRestricted: boolean;
    ownerMode: boolean;
  };
  phone: string;
  email: string;
  otpEnabled: boolean;
};

export default function AdminAccessManager({ goToCompanyData }: { goToCompanyData: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [otp, setOtp] = useState({ phone: "", email: "", otpEnabled: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/security", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (alive && !d.error) { setState(d); setOtp({ phone: d.phone || "", email: d.email || "", otpEnabled: !!d.otpEnabled }); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ ok: false, text: "تأكيد كلمة المرور لا يطابق الكلمة الجديدة" });
      return;
    }
    setBusy(true);
    const response = await fetch("/api/admin/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage({ ok: false, text: data.error || "تعذر تغيير كلمة المرور" });
      return;
    }
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ ok: true, text: "تم تغيير كلمة المرور وإلغاء كل الجلسات القديمة. الجلسة الحالية محدّثة." });
    const next = await fetch("/api/admin/security", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (next && !next.error) setState(next);
  }

  async function revoke() {
    if (!confirm("سيتم تسجيل الخروج من جميع أجهزة المدير، بما فيها هذا الجهاز. متابعة؟")) return;
    setBusy(true);
    await fetch("/api/admin/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setBusy(false);
    router.replace("/admin");
    router.refresh();
  }

  async function configureOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "configure_otp", ...otp }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage({ ok: response.ok, text: response.ok ? "تم حفظ إعدادات OTP. يجب تهيئة مزود الإرسال قبل الاستخدام." : (data.error || "تعذر حفظ الإعدادات") });
  }

  const checks = state ? [
    ["كلمة مرور مخصصة", state.configuration.customPassword],
    ["مفتاح جلسة قوي", state.configuration.customSessionSecret],
    ["نطاق إدارة مقيد", state.configuration.hostRestricted],
    ["VPN / Zero-Trust", state.configuration.networkRestricted],
  ] as const : [];

  return (
    <>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <form onSubmit={changePassword} className="panel rounded-2xl p-5">
        <h3 className="font-black text-gold2">🔑 تغيير كلمة مرور مدير النظام</h3>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          تغيير الكلمة يرفع إصدار الجلسة ويلغي كل Cookies القديمة على الأجهزة الأخرى تلقائياً.
        </p>
        <div className="mt-4 space-y-2">
          <input required type="password" autoComplete="current-password" className="input" placeholder="كلمة المرور الحالية" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          <input required minLength={8} maxLength={128} type="password" autoComplete="new-password" className="input" placeholder="كلمة المرور الجديدة — 8 خانات فأكثر" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <input required minLength={8} maxLength={128} type="password" autoComplete="new-password" className="input" placeholder="تأكيد كلمة المرور الجديدة" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>
        <p className="mt-2 text-[10px] text-white/40">الحد الأدنى 8 خانات. تقبل الحروف العربية والإنجليزية، الكبيرة والصغيرة، الأرقام والرموز، دون محارف تحكم.</p>
        {message && <div className={`mt-3 rounded-xl p-3 text-sm ${message.ok ? "bg-price/15 text-price" : "bg-red-500/15 text-red-300"}`}>{message.text}</div>}
        <button disabled={busy} className="btn-gold mt-4 w-full rounded-xl py-3 disabled:opacity-60">{busy ? "جاري التحديث..." : "حفظ كلمة المرور الجديدة"}</button>
      </form>

      <div className="space-y-5">
        <div className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">🛡️ حالة صلاحيات المالك</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {checks.map(([label, ok]: readonly [string, boolean]) => (
              <div key={label} className="rounded-xl bg-bg p-3 text-center text-[11px]">
                <div className="text-xl">{ok ? "✅" : "⚠️"}</div>
                <div className="mt-1 text-white/65">{label}</div>
              </div>
            ))}
          </div>
          {state && (
            <div className="mt-3 text-[10px] text-white/40">
              إصدار الجلسة: {state.sessionVersion} · آخر تغيير: {new Date(state.passwordChangedAt).toLocaleString("ar-SA")}
            </div>
          )}
          <button disabled={busy} onClick={revoke} className="mt-4 w-full rounded-xl bg-red-500/15 py-3 text-sm font-black text-red-300 hover:bg-red-500/25 disabled:opacity-60">
            🚪 إسقاط كل جلسات المدير
          </button>
        </div>

        <form onSubmit={configureOtp} className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">📱 دخول OTP للمالك</h3>
          <p className="mt-1 text-xs text-white/55">احفظ رقم الجوال أو البريد المسجل، ثم فعّل OTP بعد تهيئة مزود الإرسال.</p>
          <div className="mt-3 space-y-2">
            <input className="input" placeholder="رقم الجوال" value={otp.phone} onChange={(e) => setOtp({ ...otp, phone: e.target.value })} />
            <input type="email" className="input" placeholder="البريد الإلكتروني" value={otp.email} onChange={(e) => setOtp({ ...otp, email: e.target.value })} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={otp.otpEnabled} onChange={(e) => setOtp({ ...otp, otpEnabled: e.target.checked })} /> تفعيل OTP للمالك</label>
          <button disabled={busy} className="btn-ghost mt-3 w-full rounded-xl py-3 text-sm font-bold">حفظ إعدادات OTP</button>
        </form>

        <div className="panel rounded-2xl p-5">
          <h3 className="font-black text-gold2">🏢 البيانات الأساسية للنظام</h3>
          <p className="mt-1 text-xs text-white/55">اسم الشركة، الهاتف، واتساب، المدينة، عنوان المستودع والشريط المتحرك.</p>
          <button onClick={goToCompanyData} className="btn-ghost mt-3 w-full rounded-xl py-3 text-sm font-bold">فتح بيانات الشركة والخدمات</button>
        </div>
      </div>
    </div>
      <AssistantManager />
    </>
  );
}
