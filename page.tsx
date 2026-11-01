import { getBundles } from "@/lib/bundles";
import BundlesClient from "@/components/BundlesClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "العروض المتكاملة — مغسلة جاهزة",
  description: "باقات متكاملة لتجهيز مغسلة عادية أو متوسطة أو مركزية أو فندق أو مستشفى بصفقة واحدة.",
};

export default async function BundlesPage() {
  const bundles = await getBundles();
  return <BundlesClient bundles={JSON.parse(JSON.stringify(bundles))} />;
}
