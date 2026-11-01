import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      id: "/company-app",
      name: "تطبيق ومنصة شركة النجيب المتطوره لمعدات المغاسل",
      short_name: "منصة النجيب",
      description: "التطبيق والمنصة الرئيسية لشركة النجيب المتطوره لمعدات المغاسل لإدارة المعرض والخدمات والعمليات.",
      start_url: "/?source=company-pwa",
      scope: "/",
      display: "standalone",
      orientation: "any",
      background_color: "#060709",
      theme_color: "#060709",
      dir: "rtl",
      lang: "ar",
      categories: ["business", "productivity"],
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
