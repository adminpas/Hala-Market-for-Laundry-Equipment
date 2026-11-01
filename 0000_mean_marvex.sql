CREATE TABLE `admin_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` text NOT NULL DEFAULT ('owner'),
	`password_hash` text NOT NULL,
	`session_version` int NOT NULL DEFAULT 1,
	`password_changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL DEFAULT (''),
	`advertiser` text NOT NULL DEFAULT (''),
	`image_url` text NOT NULL DEFAULT (''),
	`link_url` text NOT NULL DEFAULT (''),
	`cta_label` text NOT NULL DEFAULT ('اعرف المزيد'),
	`bg_from` text NOT NULL DEFAULT ('#1a1408'),
	`bg_to` text NOT NULL DEFAULT ('#0f1115'),
	`accent` text NOT NULL DEFAULT ('#c5a059'),
	`badge` text NOT NULL DEFAULT ('إعلان'),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`clicks` int NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auction_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auction_id` int NOT NULL,
	`bidder_name` text NOT NULL,
	`entity_name` text NOT NULL DEFAULT (''),
	`phone` text NOT NULL,
	`city` text NOT NULL DEFAULT ('جدة'),
	`amount` int NOT NULL,
	`note` text NOT NULL DEFAULT (''),
	`ip` text NOT NULL DEFAULT (''),
	`risk_score` int NOT NULL DEFAULT 0,
	`flagged` boolean NOT NULL DEFAULT false,
	`is_winner` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `auction_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	`image_url` text NOT NULL DEFAULT (''),
	`video_url` text NOT NULL DEFAULT (''),
	`kind` text NOT NULL DEFAULT ('single'),
	`product_id` int,
	`bundle_id` int,
	`items_note` text NOT NULL DEFAULT (''),
	`market_value` int NOT NULL DEFAULT 0,
	`start_price` int NOT NULL DEFAULT 0,
	`reserve_price` int NOT NULL DEFAULT 0,
	`bid_step` int NOT NULL DEFAULT 500,
	`entry_fee` int NOT NULL DEFAULT 0,
	`starts_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ends_at` timestamp NOT NULL,
	`extended_times` int NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT ('draft'),
	`show_bid_count` boolean NOT NULL DEFAULT true,
	`cost_price` int NOT NULL DEFAULT 0,
	`zero_interest` boolean NOT NULL DEFAULT true,
	`free_install` boolean NOT NULL DEFAULT true,
	`free_commissioning` boolean NOT NULL DEFAULT true,
	`free_consulting` boolean NOT NULL DEFAULT true,
	`maintenance_note` text NOT NULL DEFAULT ('صيانة ومتابعة بأجور رمزية تغطي عمل اليد والتنقل فقط'),
	`project_note` text NOT NULL DEFAULT (''),
	`expected_monthly_income` int NOT NULL DEFAULT 0,
	`winner_name` text NOT NULL DEFAULT (''),
	`winner_bid_id` int,
	`winner_amount` int,
	`announced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `auctions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text NOT NULL DEFAULT (''),
	`action` text NOT NULL,
	`entity` text NOT NULL DEFAULT (''),
	`entity_id` text NOT NULL DEFAULT (''),
	`ip` text NOT NULL DEFAULT (''),
	`user_agent` text NOT NULL DEFAULT (''),
	`meta` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` text NOT NULL,
	`type` text NOT NULL DEFAULT ('ip'),
	`reason` text NOT NULL DEFAULT (''),
	`until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `blocklist_id` PRIMARY KEY(`id`),
	CONSTRAINT `blocklist_value_unique` UNIQUE(`value`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL DEFAULT ('active'),
	`expires_at` timestamp NOT NULL,
	`deposit_amount` int NOT NULL DEFAULT 0,
	`deposit_paid` boolean NOT NULL DEFAULT false,
	`deposit_ref` text NOT NULL DEFAULT (''),
	`deposit_payment_status` text NOT NULL DEFAULT ('pending'),
	`legal_version` text NOT NULL DEFAULT (''),
	`legal_accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_ar` text NOT NULL,
	`shop_type` text NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	`image_url` text NOT NULL DEFAULT (''),
	`video_url` text NOT NULL DEFAULT (''),
	`items_json` json NOT NULL,
	`list_price` int NOT NULL DEFAULT 0,
	`bundle_price` int NOT NULL DEFAULT 0,
	`capacity_note` text NOT NULL DEFAULT (''),
	`includes_install` boolean NOT NULL DEFAULT true,
	`includes_training` boolean NOT NULL DEFAULT true,
	`warranty_months` int NOT NULL DEFAULT 12,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`product_id` int NOT NULL,
	`mode` text NOT NULL DEFAULT ('buy'),
	`qty` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL DEFAULT (''),
	`icon` text NOT NULL DEFAULT ('📦'),
	`level` int NOT NULL DEFAULT 1,
	`parent_key` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`capacity_unit` text NOT NULL DEFAULT ('كجم'),
	`spec_schema` json NOT NULL,
	`ai_instructions` text NOT NULL DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `clearance_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`start_price` int NOT NULL,
	`floor_price` int NOT NULL,
	`drop_per_day` int NOT NULL DEFAULT 100,
	`starts_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ends_at` timestamp NOT NULL,
	`reason` text NOT NULL DEFAULT ('تصفية مخزون'),
	`status` text NOT NULL DEFAULT ('live'),
	`sold_price` int,
	`sold_to` text NOT NULL DEFAULT (''),
	`sold_at` timestamp,
	`watchers` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `clearance_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`facility_name` text NOT NULL DEFAULT (''),
	`email` text NOT NULL DEFAULT (''),
	`city` text NOT NULL DEFAULT ('جدة'),
	`district` text NOT NULL DEFAULT (''),
	`address` text NOT NULL DEFAULT (''),
	`lat` double,
	`lng` double,
	`distance_km` double,
	`notes` text NOT NULL DEFAULT (''),
	`legal_version` text NOT NULL DEFAULT (''),
	`legal_accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `equipment_passport` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`serial_no` text NOT NULL,
	`verify_code` text NOT NULL,
	`manufacture_year` int,
	`operating_hours` int NOT NULL DEFAULT 0,
	`inspection_score` int NOT NULL DEFAULT 0,
	`inspected_by` text NOT NULL DEFAULT (''),
	`inspected_at` timestamp,
	`parts_replaced` json NOT NULL,
	`notes` text NOT NULL DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_passport_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_passport_serial_no_unique` UNIQUE(`serial_no`),
	CONSTRAINT `equipment_passport_verify_code_unique` UNIQUE(`verify_code`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facility_name` text NOT NULL,
	`phone` text NOT NULL,
	`machine_brand` text NOT NULL,
	`error_description` text NOT NULL,
	`service_type` text NOT NULL,
	`city` text NOT NULL DEFAULT ('جدة'),
	`status` text NOT NULL DEFAULT ('new'),
	`technician_id` int,
	`eta_minutes` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL DEFAULT (''),
	`size_kb` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`kind` text NOT NULL DEFAULT ('news'),
	`link_url` text NOT NULL DEFAULT (''),
	`is_active` boolean NOT NULL DEFAULT true,
	`pinned` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `news_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`product_id` int NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`distance_km` double NOT NULL,
	`subtotal` int NOT NULL,
	`shipping_fee` int NOT NULL,
	`installation_fee` int NOT NULL,
	`vat` int NOT NULL,
	`total` int NOT NULL,
	`payment_method` text NOT NULL,
	`payment_ref` text NOT NULL,
	`payment_status` text NOT NULL DEFAULT ('pending'),
	`payment_provider` text NOT NULL DEFAULT (''),
	`deposit_amount` int NOT NULL DEFAULT 0,
	`balance_due` int NOT NULL DEFAULT 0,
	`risk_score` int NOT NULL DEFAULT 0,
	`legal_version` text NOT NULL DEFAULT (''),
	`legal_accepted_at` timestamp,
	`status` text NOT NULL DEFAULT ('pending_payment'),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`delivered_at` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `passport_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passport_id` int NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL DEFAULT (''),
	`by_name` text NOT NULL DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `passport_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beneficiary_name` text NOT NULL DEFAULT (''),
	`bank_name` text NOT NULL DEFAULT (''),
	`iban` text NOT NULL DEFAULT (''),
	`account_number` text NOT NULL DEFAULT (''),
	`vat_number` text NOT NULL DEFAULT (''),
	`enable_mada` boolean NOT NULL DEFAULT true,
	`enable_apple_pay` boolean NOT NULL DEFAULT true,
	`enable_transfer` boolean NOT NULL DEFAULT true,
	`deposit_percent` int NOT NULL DEFAULT 100,
	`is_approved` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payment_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int,
	`booking_id` int,
	`kind` text NOT NULL,
	`method` text NOT NULL,
	`provider` text NOT NULL DEFAULT (''),
	`provider_ref` text NOT NULL DEFAULT (''),
	`amount` int NOT NULL,
	`currency` text NOT NULL DEFAULT ('SAR'),
	`status` text NOT NULL DEFAULT ('pending'),
	`meta` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`brand` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text NOT NULL,
	`subcategory_ar` text NOT NULL,
	`secondary_category` text NOT NULL DEFAULT (''),
	`secondary_category_ar` text NOT NULL DEFAULT (''),
	`condition` text NOT NULL,
	`origin` text NOT NULL,
	`origin_ar` text NOT NULL,
	`capacity_kg` int NOT NULL,
	`guarantee_months` int NOT NULL,
	`price` int NOT NULL,
	`old_price` int,
	`image_url` text NOT NULL,
	`video_url` text NOT NULL,
	`description` text NOT NULL,
	`features` json NOT NULL,
	`custom_attributes` json NOT NULL,
	`dimensions` text NOT NULL,
	`weight_kg` int NOT NULL,
	`power` text NOT NULL,
	`is_spotlight` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_sold` boolean NOT NULL DEFAULT false,
	`reserved_until` timestamp,
	`reserved_by_phone` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` text NOT NULL,
	`severity` text NOT NULL DEFAULT ('low'),
	`score` int NOT NULL DEFAULT 0,
	`ip` text NOT NULL DEFAULT (''),
	`path` text NOT NULL DEFAULT (''),
	`detail` text NOT NULL DEFAULT (''),
	`blocked` boolean NOT NULL DEFAULT false,
	`resolved` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`icon` text NOT NULL DEFAULT ('⚙️'),
	`href` text NOT NULL DEFAULT ('/'),
	`color` text NOT NULL DEFAULT ('#c5a059'),
	`kind` text NOT NULL DEFAULT ('service'),
	`description` text NOT NULL DEFAULT (''),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_name` text NOT NULL DEFAULT ('شركة النجيب المتطورة لمعدات المغاسل والفنادق'),
	`tagline` text NOT NULL DEFAULT ('جديد · مستخدم'),
	`phone` text NOT NULL DEFAULT ('0126000000'),
	`whatsapp` text NOT NULL DEFAULT ('966555000000'),
	`city` text NOT NULL DEFAULT ('جدة، المملكة العربية السعودية'),
	`warehouse_address` text NOT NULL DEFAULT ('المنطقة الصناعية الثالثة، جدة'),
	`marquee_text` text NOT NULL DEFAULT (''),
	`hero_note` text NOT NULL DEFAULT (''),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `special_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ref_no` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL DEFAULT ('جدة'),
	`sector` text NOT NULL DEFAULT ('other'),
	`item_name` text NOT NULL,
	`brand` text NOT NULL DEFAULT (''),
	`model` text NOT NULL DEFAULT (''),
	`quantity` int NOT NULL DEFAULT 1,
	`specs` text NOT NULL DEFAULT (''),
	`source_country` text NOT NULL DEFAULT ('any'),
	`budget` int,
	`urgency` text NOT NULL DEFAULT ('normal'),
	`attachment_url` text NOT NULL DEFAULT (''),
	`status` text NOT NULL DEFAULT ('new'),
	`quoted_price` int,
	`eta_days` int,
	`admin_note` text NOT NULL DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `special_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `special_requests_ref_no_unique` UNIQUE(`ref_no`)
);
--> statement-breakpoint
CREATE TABLE `technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`specialty` text NOT NULL,
	`status` text NOT NULL DEFAULT ('available'),
	`completed_jobs` int NOT NULL DEFAULT 0,
	`rating` double NOT NULL DEFAULT 4.8,
	CONSTRAINT `technicians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auction_bids` ADD CONSTRAINT `auction_bids_auction_id_auctions_id_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auctions` ADD CONSTRAINT `auctions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auctions` ADD CONSTRAINT `auctions_bundle_id_bundles_id_fk` FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clearance_deals` ADD CONSTRAINT `clearance_deals_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `equipment_passport` ADD CONSTRAINT `equipment_passport_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_technician_id_technicians_id_fk` FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passport_events` ADD CONSTRAINT `passport_events_passport_id_equipment_passport_id_fk` FOREIGN KEY (`passport_id`) REFERENCES `equipment_passport`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE set null ON UPDATE no action;