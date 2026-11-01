import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "لوحة تحكم النظام",
  description: "تطبيق مصغر خاص بمدير النظام لإدارة المنصة من الجوال والكمبيوتر.",
  manifest: "/admin-manifest.webmanifest",
  icons: {
    icon: "/admin-icon-192.png",
    apple: "/admin-icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "لوحة تحكم النظام",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
