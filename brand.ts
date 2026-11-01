/** Central brand identity — change here to rebrand the whole app. */
export const BRAND = {
  /** Full legal/commercial name */
  fullName: "منصة شركة النجيب المتطورة لجميع أنواع معدات المغاسل",
  companyName: "شركة النجيب المتطورة لمعدات المغاسل",
  /** Short name for tight spaces / PWA */
  shortName: "النجيب المتطورة",
  /** Highlighted part (rendered in gold) */
  nameHighlight: "النجيب",
  /** Rest of the name next to the highlight */
  nameRest: "المتطورة",
  /** Tagline shown under the logo and in the sections bar */
  tagline: "جديد · مستخدم",
  segments: ["المغاسل الصغيرة", "المركزية", "الفنادق", "المستشفيات"] as string[],
  /** Headline shown to the customer as the platform promise. */
  promise: "عزيزي العميل — نحن نُؤمّن لك جميع معدات المغاسل بجميع أنواعها وأحجامها واستخداماتها",
  /** Service segments shown in the scrolling banner. */
  serviceSegments: [
    "مغاسل الملابس المتوسطة والصغيرة",
    "مغاسل مركزية",
    "مغاسل السجاد",
  ] as string[],
  /** Showroom title displayed at the top of every page. */
  showroomName: "شركة النجيب المتطورة لمعدات المغاسل",
  subtitle: "جميع أنواع معدات المغاسل · جدة",
  slogan: "جديد ومستخدم — معدات المغاسل والفنادق بكل الفئات",
  nameEn: "Al-Najeeb Advanced Laundry & Hotel Equipment Co.",
  city: "جدة، المملكة العربية السعودية",
  warehouse: "المنطقة الصناعية الثالثة، جدة",
  phone: "0126000000",
  whatsapp: "0555000000",
  whatsappIntl: "966555000000",
  vatNumber: "310000000000003",
  crNumber: "4030000000",
} as const

/**
 * System ownership & intellectual property.
 * Displayed in the footer, admin panel, invoices and the PWA metadata.
 */
export const DEVELOPER = {
  company: "مجموعة هلا سوفت",
  companyEn: "Hala Soft Group",
  country: "الجمهورية اليمنية",
  city: "صنعاء",
  manager: "أبو كمال المرهبي",
  managerTitle: "مدير المجموعة",
  phone: "778044803",
  phoneIntl: "967778044803",
  rightsNote: "جميع حقوق ملكية النظام محفوظة لمجموعة هلا سوفت",
} as const;
