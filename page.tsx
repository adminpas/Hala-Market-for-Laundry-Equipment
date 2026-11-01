import AuctionsClient from "@/components/AuctionsClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "المزاد الحصري",
  description: "مزادات شهرية وموسمية على معدات ومعدات متكاملة — عروض سرية وإعلان الفائز في نهاية المزاد.",
};

export default function AuctionsPage() {
  return <AuctionsClient />;
}
