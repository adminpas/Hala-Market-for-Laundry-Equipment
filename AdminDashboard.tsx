"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product, Technician, MaintenanceRequest, Booking, Order } from "@/db/schema";
import { CATEGORIES, CONDITION_LABEL, CONDITION_META, ORIGINS, formatSAR } from "@/lib/catalog";
import { DEVELOPER } from "@/lib/brand";
import ProductForm, { type ProductFormValues } from "./ProductForm";
import AdsNewsManager from "./AdsNewsManager";
import { MediaManager, PaymentManager, AiTools } from "./MediaPayAi";
import SecurityCenter from "./SecurityCenter";
import CategoryManager from "./CategoryManager";
import { ServicesManager, SiteSettingsManager } from "./ServicesManager";
import SpecialRequestsManager from "./SpecialRequestsManager";
import AuctionsManager from "./AuctionsManager";
import ClearanceManager from "./ClearanceManager";
import AiCoreMonitor from "./AiCoreMonitor";
import AdminAccessManager from "./AdminAccessManager";

type Overview = {
  products: Product[];
  bookings: { booking: Booking; productName: string | null; productPrice: number | null }[];
  orders: { order: Order; productName: string | null }[];
  tickets: MaintenanceRequest[];
  technicians: Technician[];
  stats: { revenue: number; ordersCount: number; deliveryRate: number; activeBookings: number; openTickets: number; productsCount: number; totalProducts: number };
};

const TABS = [
  { k: "overview", l: "📊 نظرة عامة" },
  { k: "products", l: "📦 المنتجات" },
  { k: "bookings", l: "⏳ الحجوزات المالية" },
  { k: "tickets", l: "🛠️ تذاكر الصيانة" },
  { k: "special", l: "🌍 الطلبات الخاصة" },
  { k: "technicians", l: "👷 الفنيون" },
  { k: "ads", l: "📣 الإعلانات" },
  { k: "news", l: "📰 شريط الأخبار" },
  { k: "media", l: "📱 الوسائط والرفع" },
  { k: "payment", l: "🏦 حساب التحصيل" },
  { k: "aicore", l: "🧠 النواة الذكية" },
  { k: "auctions", l: "🔨 المزادات" },
  { k: "clearance", l: "📉 التصفية اليومية" },
  { k: "ai", l: "🤖 الذكاء الاصطناعي" },
  { k: "security", l: "🛡️ مركز الأمن" },
  { k: "access", l: "🔑 الدخول والصلاحيات" },
  { k: "sections", l: "🗂️ إدارة الأقسام" },
  { k: "content", l: "⚡ الخدمات والهوية" },
] as const;

const TICKET_STATUS: Record<string, string> = { new: "جديد", accepted: "مقبول", assigned: "تم التعيين", en_route: "في الطريق", in_progress: "جاري الإصلاح", done: "مكتمل" };
const ORDER_STATUS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  paid: "مدفوعة",
  shipping: "قيد الشحن",
  delivered: "تم التوصيل",
  installed: "تم التركيب",
  cancelled: "ملغية",
};

export default function AdminDashboard({ initial }: { initial: Overview }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const validInitialTab = TABS.some((item) => item.k === initialTab)
    ? initialTab as (typeof TABS)[number]["k"]
    : "overview";
  // single timestamp per render keeps the render pure
  const [nowTs] = useState(() => Date.now());
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>(validInitialTab);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [productRows, setProductRows] = useState<Product[]>(initial.products);
  const [productTotal, setProductTotal] = useState(initial.stats.totalProducts);
  const [productLoading, setProductLoading] = useState(false);
  const d = initial;

  const loadProducts = useCallback(async (query = "") => {
    setProductLoading(true);
    const response = await fetch(`/api/products?admin=1&limit=120&q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setProductLoading(false);
    if (!response.ok) return false;
    setProductRows(data.products ?? []);
    setProductTotal(Number(data.total ?? 0));
    return true;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { loadProducts(q); }, 320);
    return () => clearTimeout(timer);
  }, [q, loadProducts]);

  async function api(url: string, method: string, body?: unknown) {
    setBusy(true);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "حدث خطأ");
      return false;
    }
    if (url.startsWith("/api/products")) await loadProducts(q);
    router.refresh();
    return true;
  }

  async function saveProduct(values: ProductFormValues) {
    const ok = editing === "new"
      ? await api("/api/products", "POST", values)
      : editing
        ? await api(`/api/products/${editing.id}`, "PATCH", values)
        : false;
    if (ok) setEditing(null);
  }

  const filteredProducts = productRows;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.35em] text-gold2">OWNER CONTROL ROOM</p>
          <h1 className="text-2xl font-black md:text-3xl">🎛️ غرفة تحكم المالك</h1>
          <p className="mt-1 text-[10px] text-white/35">
            نظام من تطوير {DEVELOPER.company} · {DEVELOPER.manager} ·{" "}
            <a href={`https://wa.me/${DEVELOPER.phoneIntl}`} target="_blank" rel="noreferrer" className="text-[#25D366]">
              {DEVELOPER.phone}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/install" className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">📲 تثبيت لوحة المدير</a>
          <a href="/guide" className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">📋 الدليل</a>
          <a href="/system" className="btn-gold rounded-xl px-4 py-2 text-sm">🧪 الفحص الشامل</a>
          <button onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); router.refresh(); }} className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">تسجيل الخروج</button>
        </div>
      </div>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto rounded-2xl bg-panel p-2">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === t.k ? "btn-gold" : "text-white/60 hover:bg-white/5"}`}>{t.l}</button>
        ))}
      </div>

      {busy && <div className="fixed left-4 top-20 z-50 rounded-xl bg-gold px-3 py-1.5 text-xs font-black text-bg">جاري الحفظ...</div>}

      {tab === "overview" && (
        <div className="mt-6 space-y-6">
          <div className="panel rounded-2xl p-4">
            <h3 className="font-black text-gold2">⚡ مركز الأوامر السريع</h3>
            <p className="mt-1 text-[11px] text-white/45">اضغط أي وظيفة لإدارتها مباشرة من الجوال.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {[
                ["add-product", "＋", "إضافة منتج"],
                ["sections", "🗂️", "الأقسام"],
                ["media", "📱", "رفع الوسائط"],
                ["content", "⚡", "الخدمات"],
                ["bookings", "⏳", "الحجوزات"],
                ["payment", "🏦", "التحصيل"],
                ["auctions", "🔨", "المزادات"],
                ["security", "🛡️", "الأمن"],
                ["access", "🔑", "الصلاحيات"],
              ].map(([key, icon, label]) => (
                <button key={key} onClick={() => key === "add-product" ? setEditing("new") : setTab(key as (typeof TABS)[number]["k"])}
                  className="rounded-xl border border-white/8 bg-bg p-3 text-center transition hover:border-gold/35 hover:bg-gold/5">
                  <div className="text-2xl">{icon}</div>
                  <div className="mt-1 text-[11px] font-black text-white/75">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["💰 إجمالي الإيرادات", formatSAR(d.stats.revenue), "text-price"],
              ["🧾 الطلبات المدفوعة", d.stats.ordersCount, ""],
              ["🚚 نسبة التوصيل الميداني", `${d.stats.deliveryRate}%`, "text-gold2"],
              ["⏳ حجوزات نشطة", d.stats.activeBookings, ""],
              ["🛠️ تذاكر مفتوحة", d.stats.openTickets, ""],
              ["📦 قطع متاحة", d.stats.productsCount, ""],
            ].map(([k, v, c]) => (
              <div key={String(k)} className="panel rounded-2xl p-4">
                <div className="text-[11px] text-white/50">{k}</div>
                <div className={`mt-1 text-2xl font-black ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-2xl p-5">
              <h3 className="font-black text-gold2">🚚 تتبع معدلات التوصيل والتركيب</h3>
              <div className="mt-3 space-y-2">
                {(["paid", "shipping", "delivered", "installed"] as const).map((s) => {
                  const n = d.orders.filter((o) => o.order.status === s).length;
                  const pct = d.orders.length ? Math.round((n / d.orders.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs"><span>{ORDER_STATUS[s]}</span><span className="text-white/50">{n} ({pct}%)</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-l from-gold to-gold2" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <h4 className="mt-5 text-sm font-black">آخر الطلبات</h4>
              <div className="mt-2 space-y-2">
                {d.orders.slice(0, 6).map(({ order, productName }) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg p-3 text-sm">
                    <div>
                      <div className="font-mono text-[11px] text-white/50">{order.invoiceNumber}</div>
                      <div className="font-bold">{productName}</div>
                      <div className="text-xs text-white/50">{order.customerName} · {order.city} · {order.distanceKm} كم</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-price">{formatSAR(order.total)}</span>
                      <select className="input !w-auto !py-1 text-xs" value={order.status} onChange={(e) => api(`/api/orders/${order.id}`, "PATCH", { status: e.target.value })}>
                        {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {d.orders.length === 0 && <div className="text-sm text-white/40">لا توجد طلبات بعد</div>}
              </div>
            </div>

            <div className="panel rounded-2xl p-5">
              <h3 className="font-black text-gold2">📦 توزيع المخزون</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => {
                  const items = d.products.filter((p) => p.category === c.key && p.isActive && !p.isSold);
                  return (
                    <div key={c.key} className="rounded-xl bg-bg p-3">
                      <div className="text-sm font-black">{c.icon} {c.nameAr}</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-white/60">
                        جديد: {items.filter((p) => p.condition === "new").length} · مجدد: {items.filter((p) => p.condition === "refurbished").length}<br />
                        نظيف: {items.filter((p) => p.condition === "used").length} · جاهز: {items.filter((p) => p.condition === "ready").length}
                      </div>
                      <div className="text-xs text-red-300">محجوز الآن: {items.filter((p) => p.reservedUntil && new Date(p.reservedUntil).getTime() > nowTs).length}</div>
                    </div>
                  );
                })}
              </div>
              <h4 className="mt-5 text-sm font-black">👷 حالة الفنيين</h4>
              <div className="mt-2 space-y-1">
                {d.technicians.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-bg p-2.5 text-sm">
                    <span className="font-bold">{t.name} <span className="text-xs text-white/40">· {t.specialty}</span></span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${t.status === "available" ? "bg-price/20 text-price" : "bg-amber-500/20 text-amber-300"}`}>{t.status === "available" ? "متاح" : "مشغول"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input className="input !w-72" placeholder="بحث في كل المنتجات: الاسم / SKU / الماركة" value={q} onChange={(e) => setQ(e.target.value)} />
              <span className="shrink-0 text-[11px] text-white/45">{productLoading ? "جاري البحث..." : `${productTotal.toLocaleString("en-US")} نتيجة`}</span>
            </div>
            <button onClick={() => setEditing("new")} className="btn-gold rounded-xl px-4 py-2.5 text-sm">＋ إضافة منتج جديد</button>
          </div>
          <div className="panel mt-4 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-white/5 text-xs text-white/60">
                <tr>
                  <th className="p-3 text-right">المنتج</th><th className="p-3 text-right">القسم</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">المواصفات</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">الوضع</th><th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 120).map((p) => {
                  const reserved = !!p.reservedUntil && new Date(p.reservedUntil).getTime() > nowTs;
                  return (
                    <tr key={p.id} className={`border-t border-white/5 ${!p.isActive ? "opacity-40" : ""}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt="" className="h-12 w-10 rounded object-cover" />
                          <div><div className="font-bold">{p.nameAr}</div><div className="font-mono text-[11px] text-white/40">{p.sku} · {p.brand}</div></div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">{CATEGORIES.find((c) => c.key === p.category)?.nameAr ?? p.category}<br /><span className="text-white/50">{p.subcategoryAr}{p.secondaryCategoryAr ? ` · ${p.secondaryCategoryAr}` : ""}</span></td>
                      <td className="p-3">
                        <span className="rounded px-2 py-0.5 text-[11px] font-black"
                          style={{ background: CONDITION_META[p.condition].bg, color: CONDITION_META[p.condition].color }}>
                          {CONDITION_LABEL[p.condition]}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-white/70">{p.originAr} · {p.capacityKg} كجم · ضمان {p.guaranteeMonths} شهر{p.isSpotlight && <span className="mr-1 text-gold2">★ Spotlight</span>}</td>
                      <td className="p-3 font-black text-price">{formatSAR(p.price)}</td>
                      <td className="p-3 text-xs">
                        {p.isSold ? <span className="text-white/50">مباع</span> : reserved ? <span className="badge-flash rounded bg-red-600 px-2 py-0.5 font-black">محجوز</span> : <span className="text-price">متاح</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => setEditing(p)} className="btn-ghost rounded-lg px-2.5 py-1 text-xs font-bold">تعديل</button>
                          {reserved && <button onClick={() => api(`/api/products/${p.id}`, "PATCH", { releaseReservation: true })} className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">فك الحجز</button>}
                          <button onClick={() => api(`/api/products/${p.id}`, "PATCH", { isSold: !p.isSold })} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-bold">{p.isSold ? "إعادة للعرض" : "تحديد كمباع"}</button>
                          {p.isActive ? (
                            <button onClick={() => confirm("إخفاء المنتج من المتجر؟") && api(`/api/products/${p.id}`, "DELETE")} className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">إخفاء</button>
                          ) : (
                            <button onClick={() => api(`/api/products/${p.id}`, "PATCH", { isActive: true })} className="rounded-lg bg-price/15 px-2.5 py-1 text-xs font-bold text-price">تفعيل</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {productTotal > productRows.length && <div className="p-3 text-center text-xs text-white/40">يتم عرض أحدث {productRows.length} من {productTotal.toLocaleString("en-US")} نتيجة — اكتب الاسم أو SKU للوصول لأي قطعة.</div>}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">⏳ الحجوزات المؤقتة والمؤكدة</h3>
            <div className="mt-3 space-y-2">
              {d.bookings.length === 0 && <div className="text-sm text-white/40">لا توجد حجوزات</div>}
              {d.bookings.map(({ booking, productName, productPrice }) => (
                <div key={booking.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg p-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-black ${booking.type === "temporary" ? "bg-amber-500 text-bg" : "bg-price text-bg"}`}>{booking.type === "temporary" ? "مؤقت 24س" : "مؤكد"}</span>
                      <span className="text-[11px] text-white/50">{{ pending_deposit: "بانتظار العربون", active: "نشط", expired: "منتهي", converted: "تحول لشراء", cancelled: "ملغي" }[booking.status]}</span>
                    </div>
                    <div className="mt-1 font-bold">{productName}</div>
                    <div className="text-xs text-white/50">{booking.customerName} · {booking.phone} · ينتهي {new Date(booking.expiresAt).toLocaleString("ar-SA")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-price">{productPrice ? formatSAR(productPrice) : ""}</span>
                    {booking.status === "pending_deposit" && (
                      <button onClick={() => api("/api/bookings", "PATCH", { id: booking.id, providerRef: booking.depositRef })}
                        className="rounded-lg bg-price/15 px-2.5 py-1 text-xs font-bold text-price">تأكيد وصول العربون</button>
                    )}
                    {booking.type === "temporary" && booking.status === "active" && (
                      <button onClick={() => api(`/api/products/${booking.productId}`, "PATCH", { releaseReservation: true })} className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">إلغاء الحجز</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <h3 className="font-black text-gold2">🧾 الطلبات والمدفوعات</h3>
            <div className="mt-3 space-y-2">
              {d.orders.length === 0 && <div className="text-sm text-white/40">لا توجد طلبات</div>}
              {d.orders.map(({ order, productName }) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg p-3 text-sm">
                  <div>
                    <div className="font-mono text-[11px] text-white/50">
                      {order.invoiceNumber} · {order.paymentMethod === "mada" ? "مدى" : order.paymentMethod === "apple_pay" ? "Apple Pay" : "تحويل بنكي"} · {order.paymentRef}
                    </div>
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-black ${order.paymentStatus === "paid" ? "bg-price/20 text-price" : order.paymentStatus === "test" ? "bg-purple-500/20 text-purple-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {order.paymentStatus === "paid" ? "دفع مؤكد" : order.paymentStatus === "test" ? "اختبار — لا أموال" : "بانتظار التحقق"}
                    </span>
                    <div className="font-bold">{productName}</div>
                    <div className="text-xs text-white/50">{order.customerName} · {order.phone} · {order.city} ({order.distanceKm} كم) · شحن {formatSAR(order.shippingFee)} · تركيب {formatSAR(order.installationFee)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-price">{formatSAR(order.total)}</span>
                    {order.paymentStatus === "pending" && (
                      <button onClick={() => api(`/api/orders/${order.id}`, "PATCH", { action: "confirm_payment", providerRef: order.paymentRef })}
                        className="rounded-lg bg-price/15 px-2.5 py-1 text-xs font-bold text-price">تأكيد التحويل</button>
                    )}
                    <select className="input !w-auto !py-1 text-xs" value={order.status} onChange={(e) => api(`/api/orders/${order.id}`, "PATCH", { status: e.target.value })}>
                      {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <a href={`/invoice/${order.id}`} className="btn-ghost rounded-lg px-2.5 py-1 text-xs font-bold">فاتورة</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "tickets" && (
        <div className="mt-6 space-y-3">
          {d.tickets.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">لا توجد تذاكر صيانة</div>}
          {d.tickets.map((t) => {
            const tech = d.technicians.find((x) => x.id === t.technicianId);
            return (
              <div key={t.id} className="panel rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold">#{t.id}</span>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-black ${t.serviceType === "field" ? "bg-gold text-bg" : "bg-sky-500 text-white"}`}>{t.serviceType === "field" ? "🚛 ميدانية" : "🏢 ورشة جدة"}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[11px]">{TICKET_STATUS[t.status]}</span>
                      <span className="text-[11px] text-white/40">{new Date(t.createdAt).toLocaleString("ar-SA")}</span>
                    </div>
                    <div className="mt-1 font-black">{t.facilityName} · {t.machineBrand} · {t.city}</div>
                    <div className="text-xs text-white/50">{t.phone}</div>
                    <div className="mt-1 text-sm text-white/75">{t.errorDescription}</div>
                    {tech && <div className="mt-1 text-xs text-gold2">👷 الفني: {tech.name} {t.etaMinutes ? `· ETA ${t.etaMinutes} دقيقة` : ""}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.status === "new" && <button onClick={() => api(`/api/maintenance/${t.id}`, "PATCH", { status: "accepted" })} className="btn-gold rounded-lg px-3 py-1.5 text-xs">✔ قبول التذكرة</button>}
                    {t.status !== "done" && (
                      <select className="input !w-auto !py-1.5 text-xs" value={t.technicianId ?? ""} onChange={(e) => api(`/api/maintenance/${t.id}`, "PATCH", { technicianId: e.target.value || null })}>
                        <option value="">تعيين فني...</option>
                        {d.technicians.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.status === "available" ? "متاح" : "مشغول"})</option>)}
                      </select>
                    )}
                    {t.status !== "done" && (
                      <select className="input !w-auto !py-1.5 text-xs" value={t.status} onChange={(e) => api(`/api/maintenance/${t.id}`, "PATCH", { status: e.target.value })}>
                        {Object.entries(TICKET_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "technicians" && (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {d.technicians.map((t) => {
            const jobs = d.tickets.filter((x) => x.technicianId === t.id && x.status !== "done");
            return (
              <div key={t.id} className="panel rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">👷</div>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${t.status === "available" ? "bg-price/20 text-price" : "bg-amber-500/20 text-amber-300"}`}>{t.status === "available" ? "متاح" : "مشغول"}</span>
                </div>
                <div className="mt-2 font-black">{t.name}</div>
                <div className="text-xs text-white/50">{t.specialty} · {t.phone}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-bg p-2"><div className="text-lg font-black text-gold2">{t.completedJobs}</div>مهمة مكتملة</div>
                  <div className="rounded-lg bg-bg p-2"><div className="text-lg font-black text-gold2">⭐ {t.rating}</div>التقييم</div>
                </div>
                <div className="mt-3 text-xs text-white/60">مهام حالية: {jobs.length === 0 ? "لا يوجد" : jobs.map((j) => `#${j.id}`).join("، ")}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "special" && <SpecialRequestsManager />}
      {tab === "auctions" && <AuctionsManager />}
      {tab === "clearance" && <ClearanceManager />}
      {tab === "aicore" && <AiCoreMonitor />}
      {tab === "security" && <SecurityCenter />}
      {tab === "access" && <AdminAccessManager goToCompanyData={() => setTab("content")} />}
      {tab === "sections" && <CategoryManager />}
      {tab === "content" && (
        <div className="mt-6 space-y-5">
          <SiteSettingsManager />
          <ServicesManager />
        </div>
      )}
      {tab === "media" && <MediaManager />}
      {tab === "payment" && <PaymentManager />}
      {tab === "ai" && <AiTools />}
      {tab === "ads" && <AdsNewsManager mode="ads" />}
      {tab === "news" && <AdsNewsManager mode="news" />}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={saveProduct}
          origins={ORIGINS}
        />
      )}
    </div>
  );
}
