import {
  mysqlTable,
  int,
  text,

  boolean,
  timestamp,
  json,
  double,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export type CategoryKey = "washers" | "dryers" | "carpet" | "presses" | "boilers" | "belts";
export type ConditionKey = "new" | "refurbished" | "used" | "ready";
export type SpecField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  unit?: string;
  options?: string[];
  required?: boolean;
};

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: text("sku").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  brand: text("brand").notNull(),
  // String (not a closed enum): admin-created categories work without code changes.
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  subcategoryAr: text("subcategory_ar").notNull(),
  secondaryCategory: text("secondary_category").notNull().default(""),
  secondaryCategoryAr: text("secondary_category_ar").notNull().default(""),
  condition: text("condition").$type<ConditionKey>().notNull(),
  origin: text("origin").notNull(),
  originAr: text("origin_ar").notNull(),
  capacityKg: int("capacity_kg").notNull(),
  guaranteeMonths: int("guarantee_months").notNull(),
  price: int("price").notNull(),
  oldPrice: int("old_price"),
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url").notNull(),
  description: text("description").notNull(),
  features: json("features").$type<string[]>().notNull(),
  // Arbitrary technical data defined by the category schema in the admin panel.
  customAttributes: json("custom_attributes").$type<Record<string, string | number | boolean>>().notNull(),
  dimensions: text("dimensions").notNull(),
  weightKg: int("weight_kg").notNull(),
  power: text("power").notNull(),
  isSpotlight: boolean("is_spotlight").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  isSold: boolean("is_sold").notNull().default(false),
  reservedUntil: timestamp("reserved_until"),
  reservedByPhone: text("reserved_by_phone"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  type: text("type").$type<"temporary" | "confirmed">().notNull(),
  status: text("status")
    .$type<"pending_deposit" | "active" | "expired" | "converted" | "cancelled">()
    .notNull()
    .default("active"),
  expiresAt: timestamp("expires_at").notNull(),
  depositAmount: int("deposit_amount").notNull().default(0),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositRef: text("deposit_ref").notNull().default(""),
  depositPaymentStatus: text("deposit_payment_status")
    .$type<"pending" | "test" | "paid" | "failed" | "refunded">()
    .notNull()
    .default("pending"),
  legalVersion: text("legal_version").notNull().default(""),
  legalAcceptedAt: timestamp("legal_accepted_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  distanceKm: double("distance_km").notNull(),
  subtotal: int("subtotal").notNull(),
  shippingFee: int("shipping_fee").notNull(),
  installationFee: int("installation_fee").notNull(),
  vat: int("vat").notNull(),
  total: int("total").notNull(),
  paymentMethod: text("payment_method").$type<"mada" | "apple_pay" | "bank_transfer">().notNull(),
  paymentRef: text("payment_ref").notNull(),
  paymentStatus: text("payment_status")
    .$type<"pending" | "test" | "paid" | "failed" | "refunded">()
    .notNull()
    .default("pending"),
  paymentProvider: text("payment_provider").notNull().default(""),
  depositAmount: int("deposit_amount").notNull().default(0),
  balanceDue: int("balance_due").notNull().default(0),
  riskScore: int("risk_score").notNull().default(0),
  legalVersion: text("legal_version").notNull().default(""),
  legalAcceptedAt: timestamp("legal_accepted_at"),
  status: text("status")
    .$type<"pending_payment" | "paid" | "shipping" | "delivered" | "installed" | "cancelled">()
    .notNull()
    .default("pending_payment"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deliveredAt: timestamp("delivered_at"),
});

/** Append-only payment ledger for reconciliation and audit. */
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").references(() => orders.id, { onDelete: "set null" }),
  bookingId: int("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  kind: text("kind").$type<"purchase" | "deposit" | "refund">().notNull(),
  method: text("method").$type<"mada" | "apple_pay" | "bank_transfer">().notNull(),
  provider: text("provider").notNull().default(""),
  providerRef: text("provider_ref").notNull().default(""),
  amount: int("amount").notNull(),
  currency: text("currency").notNull().default("SAR"),
  status: text("status").$type<"pending" | "test" | "paid" | "failed" | "refunded">().notNull().default("pending"),
  meta: json("meta").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  specialty: text("specialty").notNull(),
  status: text("status").$type<"available" | "busy">().notNull().default("available"),
  completedJobs: int("completed_jobs").notNull().default(0),
  rating: double("rating").notNull().default(4.8),
});

export const maintenanceRequests = mysqlTable("maintenance_requests", {
  id: int("id").autoincrement().primaryKey(),
  facilityName: text("facility_name").notNull(),
  phone: text("phone").notNull(),
  machineBrand: text("machine_brand").notNull(),
  errorDescription: text("error_description").notNull(),
  serviceType: text("service_type").$type<"field" | "workshop">().notNull(),
  city: text("city").notNull().default("جدة"),
  status: text("status")
    .$type<"new" | "accepted" | "assigned" | "en_route" | "in_progress" | "done">()
    .notNull()
    .default("new"),
  technicianId: int("technician_id").references(() => technicians.id, {
    onDelete: "set null",
  }),
  etaMinutes: int("eta_minutes"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Dynamic taxonomy: admin can add main/sub/secondary sections at runtime. */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  key: text("key").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull().default(""),
  icon: text("icon").notNull().default("📦"),
  level: int("level").notNull().default(1), // 1=main 2=sub 3=secondary
  parentKey: text("parent_key"),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  capacityUnit: text("capacity_unit").notNull().default("كجم"),
  // No-code product fields for this category (pressure, fuel, speed, etc.).
  specSchema: json("spec_schema").$type<SpecField[]>().notNull(),
  // Guidance used by the central AI for admin-created equipment categories.
  aiInstructions: text("ai_instructions").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Immutable audit trail for every sensitive action. */
/** Owner credential and session revocation state (single-owner installation). */
export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull().default("NajeebAdmin").unique(),
  passwordHash: text("password_hash").notNull(),
  sessionVersion: int("session_version").notNull().default(1),
  passwordChangedAt: timestamp("password_changed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  otpEnabled: boolean("otp_enabled").notNull().default(false),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;

export const adminAssistants = mysqlTable("admin_assistants", {
  id: int("id").autoincrement().primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  permissions: json("permissions").$type<string[]>().notNull(),
  active: boolean("active").notNull().default(true),
  sessionVersion: int("session_version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminOtpChallenges = mysqlTable("admin_otp_challenges", {
  id: int("id").autoincrement().primaryKey(),
  accountType: text("account_type").notNull(),
  accountId: int("account_id").notNull(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: int("attempts").notNull().default(0),
  used: boolean("used").notNull().default(false),
  ip: text("ip").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorType: text("actor_type").$type<"admin" | "customer" | "guest" | "system">().notNull(),
  actorId: text("actor_id").notNull().default(""),
  action: text("action").notNull(),
  entity: text("entity").notNull().default(""),
  entityId: text("entity_id").notNull().default(""),
  ip: text("ip").notNull().default(""),
  userAgent: text("user_agent").notNull().default(""),
  meta: json("meta").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** AI security engine events: fraud, intrusion, abuse, phishing. */
export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  kind: text("kind")
    .$type<"login_fail" | "rate_limit" | "fraud" | "injection" | "phishing" | "bot" | "anomaly">()
    .notNull(),
  severity: text("severity").$type<"low" | "medium" | "high" | "critical">().notNull().default("low"),
  score: int("score").notNull().default(0),
  ip: text("ip").notNull().default(""),
  path: text("path").notNull().default(""),
  detail: text("detail").notNull().default(""),
  blocked: boolean("blocked").notNull().default(false),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** IP / phone blocklist maintained by the AI engine + admin. */
export const blocklist = mysqlTable("blocklist", {
  id: int("id").autoincrement().primaryKey(),
  value: text("value").notNull().unique(),
  type: text("type").$type<"ip" | "phone">().notNull().default("ip"),
  reason: text("reason").notNull().default(""),
  until: timestamp("until"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Services shown in the animated icon bar — fully admin-managed. */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("⚙️"),
  href: text("href").notNull().default("/"),
  color: text("color").notNull().default("#c5a059"),
  kind: text("kind").$type<"section" | "service">().notNull().default("service"),
  description: text("description").notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Global site settings editable by the system administrator. */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: text("company_name").notNull().default("شركة النجيب المتطورة لمعدات المغاسل والفنادق"),
  tagline: text("tagline").notNull().default("جديد · مستخدم"),
  phone: text("phone").notNull().default("0126000000"),
  whatsapp: text("whatsapp").notNull().default("966555000000"),
  city: text("city").notNull().default("جدة، المملكة العربية السعودية"),
  warehouseAddress: text("warehouse_address").notNull().default("المنطقة الصناعية الثالثة، جدة"),
  marqueeText: text("marquee_text").notNull().default(""),
  heroNote: text("hero_note").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Service = typeof services.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;

/** Registered customers (account required only to reserve / buy). */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  facilityName: text("facility_name").notNull().default(""),
  email: text("email").notNull().default(""),
  city: text("city").notNull().default("جدة"),
  district: text("district").notNull().default(""),
  address: text("address").notNull().default(""),
  lat: double("lat"),
  lng: double("lng"),
  distanceKm: double("distance_km"),
  notes: text("notes").notNull().default(""),
  legalVersion: text("legal_version").notNull().default(""),
  legalAcceptedAt: timestamp("legal_accepted_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Shopping cart lines belonging to a customer. */
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  mode: text("mode").$type<"buy" | "reserve">().notNull().default("buy"),
  qty: int("qty").notNull().default(1),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Company bank / payment destination — editable by the system admin only. */
export const paymentSettings = mysqlTable("payment_settings", {
  id: int("id").autoincrement().primaryKey(),
  beneficiaryName: text("beneficiary_name").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  iban: text("iban").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  vatNumber: text("vat_number").notNull().default(""),
  enableMada: boolean("enable_mada").notNull().default(true),
  enableApplePay: boolean("enable_apple_pay").notNull().default(true),
  enableTransfer: boolean("enable_transfer").notNull().default(true),
  depositPercent: int("deposit_percent").notNull().default(100),
  isApproved: boolean("is_approved").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Media uploaded by the admin from phone or desktop. */
export const mediaAssets = mysqlTable("media_assets", {
  id: int("id").autoincrement().primaryKey(),
  url: text("url").notNull(),
  kind: text("kind").$type<"image" | "video">().notNull(),
  title: text("title").notNull().default(""),
  sizeKb: int("size_kb").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Digital Equipment Passport — an immutable, verifiable service history
 * for every single machine (especially used/refurbished units).
 * This is what buyers of second-hand industrial equipment actually fear:
 * "what is the real history of this machine?"
 */
export const equipmentPassport = mysqlTable("equipment_passport", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  serialNo: text("serial_no").notNull().unique(),
  verifyCode: text("verify_code").notNull().unique(),
  manufactureYear: int("manufacture_year"),
  operatingHours: int("operating_hours").notNull().default(0),
  inspectionScore: int("inspection_score").notNull().default(0),
  inspectedBy: text("inspected_by").notNull().default(""),
  inspectedAt: timestamp("inspected_at"),
  partsReplaced: json("parts_replaced").$type<string[]>().notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Append-only lifecycle events for a machine (audit-grade provenance). */
export const passportEvents = mysqlTable("passport_events", {
  id: int("id").autoincrement().primaryKey(),
  passportId: int("passport_id").notNull().references(() => equipmentPassport.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"inspection" | "repair" | "sale" | "install" | "service">().notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  byName: text("by_name").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type EquipmentPassport = typeof equipmentPassport.$inferSelect;
export type PassportEvent = typeof passportEvents.$inferSelect;

/** Ready-made turnkey packages: a full laundry sold as one deal. */
export const bundles = mysqlTable("bundles", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: text("name_ar").notNull(),
  shopType: text("shop_type").$type<"small" | "medium" | "central" | "hotel" | "hospital" | "carpet">().notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  itemsJson: json("items_json").$type<{ productId: number; qty: number; role: string }[]>().notNull(),
  listPrice: int("list_price").notNull().default(0),
  bundlePrice: int("bundle_price").notNull().default(0),
  capacityNote: text("capacity_note").notNull().default(""),
  includesInstall: boolean("includes_install").notNull().default(true),
  includesTraining: boolean("includes_training").notNull().default(true),
  warrantyMonths: int("warranty_months").notNull().default(12),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Bundle = typeof bundles.$inferSelect;

/**
 * Special / import requests: any machine the customer needs that is not in
 * the catalogue — sourced locally, from the Gulf, or imported worldwide.
 */
export const specialRequests = mysqlTable("special_requests", {
  id: int("id").autoincrement().primaryKey(),
  refNo: text("ref_no").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull().default("جدة"),
  sector: text("sector")
    .$type<"home" | "workshop" | "factory" | "company" | "government" | "hotel" | "hospital" | "other">()
    .notNull()
    .default("other"),
  itemName: text("item_name").notNull(),
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  quantity: int("quantity").notNull().default(1),
  specs: text("specs").notNull().default(""),
  sourceCountry: text("source_country").notNull().default("any"),
  budget: int("budget"),
  urgency: text("urgency").$type<"normal" | "urgent">().notNull().default("normal"),
  attachmentUrl: text("attachment_url").notNull().default(""),
  status: text("status")
    .$type<"new" | "sourcing" | "quoted" | "approved" | "ordered" | "shipping" | "delivered" | "closed">()
    .notNull()
    .default("new"),
  quotedPrice: int("quoted_price"),
  etaDays: int("eta_days"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SpecialRequest = typeof specialRequests.$inferSelect;

/**
 * Sealed-bid auctions. Bids are PRIVATE: only the system administrator can
 * see amounts and bidders while the auction runs. When it closes, only the
 * winner's name is published on the storefront.
 */
export const auctions = mysqlTable("auctions", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  kind: text("kind").$type<"single" | "bundle">().notNull().default("single"),
  productId: int("product_id").references(() => products.id, { onDelete: "set null" }),
  bundleId: int("bundle_id").references(() => bundles.id, { onDelete: "set null" }),
  itemsNote: text("items_note").notNull().default(""),
  marketValue: int("market_value").notNull().default(0),
  startPrice: int("start_price").notNull().default(0),
  reservePrice: int("reserve_price").notNull().default(0),
  bidStep: int("bid_step").notNull().default(500),
  entryFee: int("entry_fee").notNull().default(0),
  startsAt: timestamp("starts_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  endsAt: timestamp("ends_at").notNull(),
  extendedTimes: int("extended_times").notNull().default(0),
  status: text("status").$type<"draft" | "live" | "closed" | "awarded" | "cancelled">().notNull().default("draft"),
  showBidCount: boolean("show_bid_count").notNull().default(true),
  // ---- project-enablement model (cost price, zero interest, free perks) ----
  costPrice: int("cost_price").notNull().default(0),
  zeroInterest: boolean("zero_interest").notNull().default(true),
  freeInstall: boolean("free_install").notNull().default(true),
  freeCommissioning: boolean("free_commissioning").notNull().default(true),
  freeConsulting: boolean("free_consulting").notNull().default(true),
  maintenanceNote: text("maintenance_note").notNull().default("صيانة ومتابعة بأجور رمزية تغطي عمل اليد والتنقل فقط"),
  projectNote: text("project_note").notNull().default(""),
  expectedMonthlyIncome: int("expected_monthly_income").notNull().default(0),
  winnerName: text("winner_name").notNull().default(""),
  winnerBidId: int("winner_bid_id"),
  winnerAmount: int("winner_amount"),
  announcedAt: timestamp("announced_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Individual sealed bid — never exposed publicly. */
export const auctionBids = mysqlTable("auction_bids", {
  id: int("id").autoincrement().primaryKey(),
  auctionId: int("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  bidderName: text("bidder_name").notNull(),
  entityName: text("entity_name").notNull().default(""),
  phone: text("phone").notNull(),
  city: text("city").notNull().default("جدة"),
  amount: int("amount").notNull(),
  note: text("note").notNull().default(""),
  ip: text("ip").notNull().default(""),
  riskScore: int("risk_score").notNull().default(0),
  flagged: boolean("flagged").notNull().default(false),
  isWinner: boolean("is_winner").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Auction = typeof auctions.$inferSelect;
export type AuctionBid = typeof auctionBids.$inferSelect;

/**
 * Dutch-style clearance: the price drops automatically each day until the
 * machine sells or hits its floor price. Best tool for moving aged stock.
 */
export const clearanceDeals = mysqlTable("clearance_deals", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  startPrice: int("start_price").notNull(),
  floorPrice: int("floor_price").notNull(),
  dropPerDay: int("drop_per_day").notNull().default(100),
  startsAt: timestamp("starts_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  endsAt: timestamp("ends_at").notNull(),
  reason: text("reason").notNull().default("تصفية مخزون"),
  status: text("status").$type<"live" | "sold" | "ended">().notNull().default("live"),
  soldPrice: int("sold_price"),
  soldTo: text("sold_to").notNull().default(""),
  soldAt: timestamp("sold_at"),
  watchers: int("watchers").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ClearanceDeal = typeof clearanceDeals.$inferSelect;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;

/** Commercial advertising slots sold to third parties. */
export const ads = mysqlTable("ads", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  advertiser: text("advertiser").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default("اعرف المزيد"),
  bgFrom: text("bg_from").notNull().default("#1a1408"),
  bgTo: text("bg_to").notNull().default("#0f1115"),
  accent: text("accent").notNull().default("#c5a059"),
  badge: text("badge").notNull().default("إعلان"),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  clicks: int("clicks").notNull().default(0),
  impressions: int("impressions").notNull().default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Company news / alerts ticker managed by the system administrator. */
export const newsItems = mysqlTable("news_items", {
  id: int("id").autoincrement().primaryKey(),
  text: text("text").notNull(),
  kind: text("kind").$type<"news" | "alert" | "offer" | "info">().notNull().default("news"),
  linkUrl: text("link_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  pinned: boolean("pinned").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Ad = typeof ads.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
