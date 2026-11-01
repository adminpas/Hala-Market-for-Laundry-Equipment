import ClearanceClient from "@/components/ClearanceClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "التصفية اليومية — السعر ينخفض كل يوم",
  description: "معدات بأسعار تنخفض تلقائياً كل يوم حتى تُباع. من يشتري أولاً يضمنها، ومن ينتظر يخاطر.",
};

export default function ClearancePage() {
  return <ClearanceClient />;
}
