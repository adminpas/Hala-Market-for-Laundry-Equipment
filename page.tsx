"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatSAR } from "@/lib/catalog";
import TechnicianTracker from "@/components/TechnicianTracker";

type BookingRow = { booking: { id: number; type: string; status: string; expiresAt: string; createdAt: string; productId: number }; product: { id: number; nameAr: string; price: number; imageUrl: string; condition: string } | null };
type OrderRow = { order: { id: number; invoiceNumber: string; total: number; status: string; createdAt: string; city: string; distanceKm: number }; product: { id: number; nameAr: string; imageUrl: string } | null };
type TicketRow = { ticket: { id: number; facilityName: string; machineBrand: string; errorDescription: string; serviceType: "field" | "workshop"; status: string; etaMinutes: number | null; createdAt: string; updatedAt: string }; technician: { id: number; name: string; phone: string; rating: number } | null };

const ORDER_STATUS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  paid: "مدفوعة",
  shipping: "قيد الشحن",
  delivered: "تم التوصيل",
  installed: "تم التركيب",
  cancelled: "ملغية",
};

function Countdown({ iso }: { iso: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) return setT("انتهى");
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setT(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [iso]);
  return <span className="font-mono font-black text-gold2">{t}</span>;
}

export default function DashboardPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [tab, setTab] = useState<"bookings" | "orders" | "maintenance">("bookings");
  const [data, setData] = useState<{ bookings: BookingRow[]; orders: OrderRow[]; tickets: TicketRow[] }>({ bookings: [], orders: [], tickets: [] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    const [b, o, m] = await Promise.all([
      fetch(`/api/bookings`).then((r) => r.json()),
      fetch(`/api/orders`).then((r) => r.json()),
      fetch(`/api/maintenance`).then((r) => r.json()),
    ]);
    if (b.needAuth || o.needAuth || m.needAuth) {
      window.location.href = "/account?next=/dashboard";
      return;
    }
    setData({ bookings: b.bookings ?? [], orders: o.orders ?? [], tickets: m.tickets ?? [] });
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const saved = localStorage.getItem("lx_customer");
      if (!saved) return;
      const c = JSON.parse(saved);
      setPhone(c.phone || "");
      setName(c.name || "");
      if (c.phone) {
        setActive(c.phone);
        load(c.phone);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => load(active), 15000);
    return () => clearInterval(t);
  }, [active, load]);

  function enter(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    localStorage.setItem("lx_customer", JSON.stringify({ name, phone }));
    setActive(phone);
    load(phone);
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="panel panel-glow rounded-3xl p-8 text-center">
          <div className="text-5xl">👤</div>
          <h1 className="mt-3 text-2xl font-black">لوحة تحكم العميل</h1>
          <p className="mt-1 text-sm text-white/55">أدخل رقم جوالك لمتابعة حجوزاتك وفواتيرك وطلبات الصيانة</p>
          <form onSubmit={enter} className="mt-5 space-y-3">
            <input className="input" placeholder="الاسم (اختياري)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="رقم الجوال" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <button className="btn-gold w-full rounded-xl py-3">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { k: "bookings", l: "⏳ الحجوزات", n: data.bookings.length },
    { k: "orders", l: "🧾 الفواتير", n: data.orders.length },
    { k: "maintenance", l: "🛠️ الصيانة", n: data.tickets.length },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">مرحباً {name || "بك"} 👋</h1>
          <p className="text-sm text-white/50">رقم الجوال: {active} · <button className="text-gold2 underline" onClick={() => { setActive(null); }}>تغيير</button></p>
        </div>
        <Link href="/" className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">🎬 العودة للمعرض</Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-panel p-2">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`rounded-xl py-3 text-sm font-black transition ${tab === t.k ? "btn-gold" : "text-white/60 hover:bg-white/5"}`}>
            {t.l} <span className="mr-1 rounded-full bg-black/20 px-2 text-xs">{t.n}</span>
          </button>
        ))}
      </div>

      {loading && data.bookings.length === 0 && <div className="mt-6 text-center text-white/40">جاري التحميل...</div>}

      <div className="mt-6 space-y-3">
        {tab === "bookings" &&
          (data.bookings.length === 0 ? (
            <Empty text="لا توجد حجوزات بعد" />
          ) : (
            data.bookings.map(({ booking, product }) => (
              <div key={booking.id} className="panel flex flex-wrap items-center gap-4 rounded-2xl p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product?.imageUrl} alt="" className="h-20 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${booking.type === "temporary" ? "bg-amber-500 text-bg" : "bg-price text-bg"}`}>{booking.type === "temporary" ? "حجز مؤقت 24 ساعة" : "حجز مؤكد (مدفوع)"}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${booking.status === "active" ? "bg-white/10" : "bg-white/5 text-white/40"}`}>
                      {{ active: "نشط", expired: "منتهي", converted: "تم الشراء", cancelled: "ملغي" }[booking.status]}
                    </span>
                  </div>
                  <div className="mt-1 font-black">{product?.nameAr}</div>
                  <div className="text-sm text-price">{product && formatSAR(product.price)}</div>
                  {booking.type === "temporary" && booking.status === "active" && (
                    <div className="mt-1 text-xs text-white/60">ينتهي الحجز خلال <Countdown iso={booking.expiresAt} /></div>
                  )}
                </div>
                {booking.type === "temporary" && booking.status === "active" && product && (
                  <Link href={`/checkout/${product.id}`} className="btn-gold rounded-xl px-4 py-2.5 text-sm">⚡ إتمام الشراء الآن</Link>
                )}
              </div>
            ))
          ))}

        {tab === "orders" &&
          (data.orders.length === 0 ? (
            <Empty text="لا توجد فواتير بعد" />
          ) : (
            data.orders.map(({ order, product }) => (
              <div key={order.id} className="panel flex flex-wrap items-center gap-4 rounded-2xl p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product?.imageUrl} alt="" className="h-20 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-white/50">{order.invoiceNumber}</div>
                  <div className="font-black">{product?.nameAr}</div>
                  <div className="text-xs text-white/60">{order.city} · {order.distanceKm} كم · {new Date(order.createdAt).toLocaleDateString("ar-SA")}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-black text-price">{formatSAR(order.total)}</span>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold">{ORDER_STATUS[order.status] ?? order.status}</span>
                  </div>
                </div>
                <Link href={`/invoice/${order.id}`} className="btn-ghost rounded-xl px-4 py-2.5 text-sm font-bold">⬇️ فاتورة PDF</Link>
              </div>
            ))
          ))}

        {tab === "maintenance" &&
          (data.tickets.length === 0 ? (
            <Empty text="لا توجد طلبات صيانة" cta={{ href: "/maintenance", label: "طلب صيانة جديد" }} />
          ) : (
            data.tickets.map(({ ticket, technician }) => (
              <div key={ticket.id} className="panel rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-white/50">طلب #{ticket.id} · {new Date(ticket.createdAt).toLocaleString("ar-SA")}</div>
                    <div className="font-black">{ticket.serviceType === "field" ? "🚛 صيانة ميدانية" : "🏢 شحن للورشة"} — {ticket.machineBrand}</div>
                    <div className="text-sm text-white/60">{ticket.errorDescription}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <TechnicianTracker status={ticket.status} technician={technician} etaMinutes={ticket.etaMinutes} serviceType={ticket.serviceType} createdAt={ticket.updatedAt} />
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
      {text}
      {cta && <div className="mt-3"><Link href={cta.href} className="btn-gold rounded-xl px-4 py-2 text-sm">{cta.label}</Link></div>}
    </div>
  );
}
