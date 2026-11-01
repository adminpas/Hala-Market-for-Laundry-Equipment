import { adminBoundaryAllowed, currentAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getAdminOverview } from "@/lib/data";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminFirstPassword from "@/components/admin/AdminFirstPassword";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await adminBoundaryAllowed())) notFound();
  const identity = await currentAdmin();
  if (!identity) return <AdminLogin />;
  if (identity.mustChangePassword) return <AdminFirstPassword />;
  const data = await getAdminOverview();
  return (
    <AdminDashboard
      initial={JSON.parse(JSON.stringify(data))}
    />
  );
}
