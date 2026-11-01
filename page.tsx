import InstallClient from "@/components/InstallClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "تثبيت التطبيق على جميع الأجهزة",
  description: "ثبّت منصة النجيب على أندرويد وآيفون وآيباد وويندوز وماك ولينكس.",
};

export default function InstallPage() {
  return <InstallClient />;
}
