import { NextResponse } from "next/server";
import { BRAND } from "@/lib/brand";
import { adminBoundaryAllowed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await adminBoundaryAllowed())) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(
    {
      id: "/admin-app",
      name: "لوحة تحكم النظام",
      short_name: "لوحة تحكم النظام",
      description: "لوحة مدير النظام لإدارة المنتجات والأقسام والأسعار والوسائط والحجوزات والمدفوعات والأمن والذكاء.",
      start_url: "/admin?source=admin-pwa",
      scope: "/",
      display: "standalone",
      orientation: "any",
      background_color: "#08090c",
      theme_color: "#08090c",
      dir: "rtl",
      lang: "ar",
      categories: ["business", "productivity"],
      icons: [
        { src: "/admin-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/admin-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/admin-icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        { name: "المنتجات", url: "/admin?tab=products", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
        { name: "الحجوزات", url: "/admin?tab=bookings", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
        { name: "الوسائط", url: "/admin?tab=media", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
        { name: "الأمن", url: "/admin?tab=security", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}
