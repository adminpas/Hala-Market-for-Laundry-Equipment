import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { BRAND, DEVELOPER } from "@/lib/brand";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "معرض شركة النجيب المتطوره لمعدات المغاسل",
  description: `${BRAND.fullName} في جدة — بيع معدات المغاسل الجديدة والمستعملة المجددة، الحجز والشراء والصيانة والخدمات الذكية.`,
  manifest: "/manifest.webmanifest",
  authors: [{ name: DEVELOPER.company }],
  creator: DEVELOPER.company,
  publisher: BRAND.companyName,
  other: { "developer-contact": `${DEVELOPER.manager} - ${DEVELOPER.phone}` },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "معرض النجيب", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#060709",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="min-h-screen bg-bg text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
