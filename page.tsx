import AdvisorClient from "@/components/AdvisorClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "مستشار المشروع الذكي",
  description: "دراسة جدوى، إرشاد قبل المزاد، ومتابعة ذكية بعد التركيب لضمان استدامة مشروعك.",
};

export default function AdvisorPage() {
  return <AdvisorClient />;
}
