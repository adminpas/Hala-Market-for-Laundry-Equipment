import { db } from "@/db";
import { categories, services, siteSettings, type SpecField } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { CATEGORIES as DEFAULT_CATEGORIES } from "@/lib/catalog";
import { SERVICE_ICONS as DEFAULT_SERVICES } from "@/lib/services";

/** Shape consumed by the storefront UI. */
export type UiCategory = {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  capacityUnit: string;
  specSchema: SpecField[];
  aiInstructions: string;
  subcategories: {
    key: string;
    nameAr: string;
    secondary: { key: string; nameAr: string }[];
  }[];
};

export type UiService = {
  key: string; label: string; icon: string; href: string; color: string; kind: "section" | "service";
};

/** Seed the DB taxonomy + services from built-in defaults on first run. */
export async function ensureTaxonomy() {
  const [cat] = await db.select({ id: categories.id }).from(categories).limit(1);
  if (!cat) {
    const values: (typeof categories.$inferInsert)[] = [];
    DEFAULT_CATEGORIES.forEach((c, i) => {
      values.push({
        key: c.key, nameAr: c.nameAr, nameEn: c.nameEn, icon: c.icon,
        level: 1, parentKey: null, sortOrder: i + 1,
        capacityUnit: c.key === "boilers" ? "كجم بخار/ساعة" : c.key === "presses" ? "بوصة" : "كجم",
        specSchema: [],
      });
      c.subcategories.forEach((s, j) => {
        values.push({ key: s.key, nameAr: s.nameAr, nameEn: "", icon: "•", level: 2, parentKey: c.key, sortOrder: j + 1, specSchema: [] });
      });
    });
    await db.insert(categories).values(values);
  }

  const [svc] = await db.select({ id: services.id }).from(services).limit(1);
  if (!svc) {
    await db
      .insert(services)
      .values(
        DEFAULT_SERVICES.map((s, i) => ({
          key: s.key, label: s.label, icon: s.icon, href: s.href,
          color: s.color, kind: s.kind, sortOrder: i + 1,
        })),
      )
      ;
  }

  const [st] = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
  if (!st) await db.insert(siteSettings).values({});
}

/** Live category tree used to render the storefront. */
export async function getUiCategories(): Promise<UiCategory[]> {
  await ensureTaxonomy();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return rows
    .filter((r) => r.level === 1)
    .map((m) => ({
      key: m.key,
      nameAr: m.nameAr,
      nameEn: m.nameEn,
      icon: m.icon,
      capacityUnit: m.capacityUnit,
      specSchema: m.specSchema ?? [],
      aiInstructions: m.aiInstructions,
      subcategories: rows
        .filter((s) => s.level === 2 && s.parentKey === m.key)
        .map((s) => ({
          key: s.key,
          nameAr: s.nameAr,
          secondary: rows
            .filter((z) => z.level === 3 && z.parentKey === s.key)
            .map((z) => ({ key: z.key, nameAr: z.nameAr })),
        })),
    }));
}

export async function getUiServices(): Promise<UiService[]> {
  await ensureTaxonomy();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.sortOrder), asc(services.id));
  return rows.map((s) => ({ key: s.key, label: s.label, icon: s.icon, href: s.href, color: s.color, kind: s.kind }));
}

export async function getSiteSettings() {
  await ensureTaxonomy();
  const [row] = await db.select().from(siteSettings).limit(1);
  return row;
}
