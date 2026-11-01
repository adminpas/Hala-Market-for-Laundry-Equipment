import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "معرض شركة النجيب المتطوره لمعدات المغاسل",
    short_name: "معرض النجيب",
    description: "تطبيق العملاء لتصفح معدات المغاسل والعروض والبحث والحجز والشراء والصيانة ومتابعة الطلبات.",
    id: "/customer-app",
    start_url: "/?source=customer-pwa",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#060709",
    theme_color: "#060709",
    orientation: "any",
    categories: ["business", "shopping", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "المتجر", short_name: "المتجر", url: "/market", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "تسجيل العميل", short_name: "دخول", url: "/account", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "لوحة العميل", short_name: "طلباتي", url: "/dashboard", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "السلة", short_name: "السلة", url: "/cart", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
