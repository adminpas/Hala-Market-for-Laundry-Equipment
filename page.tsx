import HomeShowcase from "@/components/HomeShowcase";
import { getShowcaseProducts } from "@/lib/data";
import { getActiveAds, getActiveNews, seedContentIfEmpty } from "@/lib/content";
import { getUiCategories, getUiServices } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await seedContentIfEmpty();
  const [products, ads, news, categories, services] = await Promise.all([
    getShowcaseProducts(), getActiveAds(), getActiveNews(), getUiCategories(), getUiServices(),
  ]);
  return <HomeShowcase initialProducts={products} ads={ads} news={news} categories={categories} services={services} />;
}
