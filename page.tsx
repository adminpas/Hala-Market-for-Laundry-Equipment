import SpecialClient from "@/components/SpecialClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "الطلبات الخاصة والاستيراد",
  description: "اطلب أي معدة أو جهاز غير متوفر — نؤمّنه لك من داخل المملكة أو دول الخليج أو نستورده من أي دولة.",
};

export default function SpecialPage() {
  return <SpecialClient />;
}
