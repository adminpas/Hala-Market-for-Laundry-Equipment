import { requireAdmin } from "@/lib/auth";
import AdminLogin from "@/components/admin/AdminLogin";
import SystemCheckClient from "@/components/admin/SystemCheckClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفحص الشامل للنظام" };

export default async function SystemPage() {
  if (!(await requireAdmin())) return <AdminLogin />;
  return <SystemCheckClient />;
}
