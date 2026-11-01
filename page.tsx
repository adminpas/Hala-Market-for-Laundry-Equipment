import SearchClient from "@/components/SearchClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "البحث الذكي",
  description: "ابحث بالاسم والنوع والحجم والجودة والسعر، أو جهّز مغسلتك كاملة حسب ميزانيتك.",
};

export default function SearchPage() {
  return <SearchClient />;
}
