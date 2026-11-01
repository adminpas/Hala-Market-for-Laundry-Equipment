import VerifyClient from "@/components/VerifyClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "التحقق من بطاقة المعدة",
  description: "تحقق من الهوية الرقمية وسجل الصيانة لأي معدة قبل الشراء.",
};

export default function VerifyPage() {
  return <VerifyClient />;
}
