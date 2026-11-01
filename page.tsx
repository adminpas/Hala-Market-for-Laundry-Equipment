import AdminInstallClient from "@/components/admin/AdminInstallClient";
import { adminBoundaryAllowed } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminInstallPage() {
  if (!(await adminBoundaryAllowed())) notFound();
  return <AdminInstallClient />;
}
