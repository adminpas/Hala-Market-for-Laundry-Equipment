import type { Metadata } from "next";
import HomeShowcase from "@/components/HomeShowcase";
import { getShowcaseProducts } from "@/lib/data";
import { getActiveAds, getActiveNews, seedContentIfEmpty } from "@/lib/content";
import { getUiCategories, getUiServices } from "@/lib/taxonomy";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `المتجر | ${BRAND.fullName}`,
  description: `متجر ${BRAND.fullName} — غسالات، نشافات، خطوط سجاد، مكابس وغلايات جديدة ومستعملة مجددة في جدة.`,
};

/**
 * Alias route for the storefront ("market").
 * Same catalogue experience as the home page, reachable at /market.
 */
export default async function MarketPage() {
  await seedContentIfEmpty();
  const [products, ads, news, categories, services] = await Promise.all([
    getShowcaseProducts(), getActiveAds(), getActiveNews(), getUiCategories(), getUiServices(),
  ]);
  return <HomeShowcase initialProducts={products} ads={ads} news={news} categories={categories} services={services} />;
}
