import { notFound } from "next/navigation";
import { getSectionProducts } from "@/lib/data";
import { getUiCategories } from "@/lib/taxonomy";
import SectionGrid from "@/components/SectionGrid";

export const dynamic = "force-dynamic";

async function findSection(key: string) {
  const CATEGORIES = await getUiCategories();
  const main = CATEGORIES.find((c) => c.key === key);
  if (main) return { title: main.nameAr, icon: main.icon, level: 1 as const, key };
  for (const c of CATEGORIES) {
    const sub = c.subcategories.find((s) => s.key === key);
    if (sub) return { title: sub.nameAr, icon: c.icon, level: 2 as const, key, parent: c.nameAr };
    for (const child of c.subcategories) {
      const secondary = child.secondary.find((s) => s.key === key);
      if (secondary) return {
        title: secondary.nameAr,
        icon: c.icon,
        level: 3 as const,
        key,
        parent: `${c.nameAr} · ${child.nameAr}`,
      };
    }
  }
  return null;
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { key } = await params;
  const { c } = await searchParams;
  const sec = await findSection(key);
  if (!sec) notFound();

  const items = await getSectionProducts(key, sec.level);
  // trim list payload; full details load in the modal
  const light = items.map((p) => ({ ...p, description: p.description.slice(0, 90), features: p.features.slice(0, 3) }));

  return (
    <SectionGrid
      title={sec.title}
      icon={sec.icon}
      parent={"parent" in sec ? sec.parent : undefined}
      products={light}
      initialCondition={c === "used" ? "used" : "new"}
    />
  );
}
