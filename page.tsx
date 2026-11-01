import { notFound } from "next/navigation";
import { getProductById, toPublic } from "@/lib/data";
import CheckoutClient from "@/components/CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductById(Number(id));
  if (!p) notFound();
  return <CheckoutClient product={toPublic(p)} />;
}
