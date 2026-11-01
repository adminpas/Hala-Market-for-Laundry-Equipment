import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WAREHOUSE, formatSAR } from "@/lib/catalog";
import PrintButton from "@/components/PrintButton";
import { BRAND, DEVELOPER } from "@/lib/brand";
import { getCurrentCustomer } from "@/lib/customer";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUS_AR: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  paid: "مدفوعة",
  shipping: "قيد الشحن",
  delivered: "تم التوصيل",
  installed: "تم التركيب",
  cancelled: "ملغية",
};
const PAYMENT_AR: Record<string, string> = {
  pending: "بانتظار التحقق",
  test: "معاملة اختبار — لم تُخصم أموال",
  paid: "دفع مؤكد",
  failed: "فشل الدفع",
  refunded: "تم الاسترداد",
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ order: orders, product: products })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, Number(id)));
  if (!row) notFound();
  const { order, product } = row;

  // Authorisation: only the invoice owner or the system admin may view it.
  const [me, isAdmin] = await Promise.all([getCurrentCustomer(), requireAdmin()]);
  if (!isAdmin && me?.phone !== order.phone) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 text-xl font-black text-gold2">هذه الفاتورة خاصة</h1>
        <p className="mt-2 text-sm text-white/55">سجّل الدخول بحساب العميل صاحب الطلب لعرض الفاتورة.</p>
        <a href={`/account?next=/invoice/${order.id}`} className="btn-gold mt-5 inline-block rounded-xl px-6 py-3">تسجيل الدخول</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black">🧾 الفاتورة {order.invoiceNumber}</h1>
        <div className="flex gap-2">
          <PrintButton />
          <a href="/dashboard" className="btn-ghost rounded-xl px-4 py-2 text-sm font-bold">حسابي</a>
        </div>
      </div>

      <div className="print-invoice rounded-2xl bg-white p-6 text-black shadow-2xl md:p-10">
        <div className="flex items-start justify-between border-b-2 border-[#c5a059] pb-4">
          <div>
            <div className="text-2xl font-black">{BRAND.fullName}</div>
            <div className="text-[11px] text-black/50">{BRAND.nameEn}</div>
            <div className="text-xs text-black/60">{WAREHOUSE.address}</div>
            <div className="text-xs text-black/60">الرقم الضريبي: {BRAND.vatNumber} · س.ت: {BRAND.crNumber}</div>
          </div>
          <div className="text-left">
            <div className="text-xs text-black/60">{order.paymentStatus === "paid" ? "فاتورة ضريبية" : order.paymentStatus === "test" ? "مستند اختبار — غير مالي" : "طلب بانتظار الدفع — ليس فاتورة نهائية"}</div>
            <div className="font-mono text-lg font-black">{order.invoiceNumber}</div>
            <div className="text-xs">{new Date(order.createdAt).toLocaleString("ar-SA")}</div>
            <div className="mt-1 inline-block rounded bg-[#10b981] px-2 py-0.5 text-xs font-black text-white">{STATUS_AR[order.status]}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-black text-black/50">العميل</div>
            <div className="font-black">{order.customerName}</div>
            <div>{order.phone}</div>
            <div>{order.city} — {order.address}</div>
          </div>
          <div>
            <div className="text-xs font-black text-black/50">الدفع</div>
            <div className="font-black">{order.paymentMethod === "mada" ? "مدى mada" : order.paymentMethod === "apple_pay" ? "Apple Pay" : "تحويل بنكي"}</div>
            <div className="font-mono text-xs">المرجع: {order.paymentRef}</div>
            <div className={`mt-1 text-xs font-black ${order.paymentStatus === "paid" ? "text-[#10b981]" : order.paymentStatus === "test" ? "text-purple-700" : "text-amber-700"}`}>
              {PAYMENT_AR[order.paymentStatus] ?? order.paymentStatus}
            </div>
            <div className="text-xs">المسافة من المستودع: {order.distanceKm} كم</div>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="bg-black/5 text-right">
              <th className="p-2">البند</th>
              <th className="p-2">التفاصيل</th>
              <th className="p-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-black">{product?.nameAr ?? "ماكينة"}</td>
              <td className="p-2 text-xs text-black/60">{product?.nameEn} · SKU {product?.sku} · {product?.condition === "new" ? "جديد كرت" : "مستعمل مجدد"} · ضمان {product?.guaranteeMonths} شهر</td>
              <td className="p-2 text-left font-bold">{formatSAR(order.subtotal)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-black">رسوم الشحن</td>
              <td className="p-2 text-xs text-black/60">من مستودع جدة إلى {order.city} ({order.distanceKm} كم)</td>
              <td className="p-2 text-left font-bold">{formatSAR(order.shippingFee)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-black">التركيب الميداني</td>
              <td className="p-2 text-xs text-black/60">فريق فني متخصص + تشغيل تجريبي</td>
              <td className="p-2 text-left font-bold">{formatSAR(order.installationFee)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-black">ضريبة القيمة المضافة 15%</td>
              <td className="p-2" />
              <td className="p-2 text-left font-bold">{formatSAR(order.vat)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="p-2 text-lg font-black" colSpan={2}>الإجمالي المدفوع</td>
              <td className="p-2 text-left text-lg font-black text-[#10b981]">{formatSAR(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 flex items-end justify-between text-xs text-black/60">
          <div>
            شكراً لثقتكم — {BRAND.fullName}، جدة
            <div className="mt-1 text-[9px] text-black/40">
              نظام إدارة المنصة من تطوير {DEVELOPER.company} — {DEVELOPER.city}، {DEVELOPER.country} · {DEVELOPER.phone}
            </div>
          </div>
          <div className="h-16 w-16 rounded border border-black/20 bg-[repeating-linear-gradient(45deg,#000_0_2px,#fff_2px_4px)]" title="QR ZATCA" />
        </div>
      </div>
    </div>
  );
}
