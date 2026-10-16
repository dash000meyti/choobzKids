CREATE TABLE `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`job_title` text,
	`bio` text DEFAULT '' NOT NULL,
	`knows_about` text DEFAULT '[]' NOT NULL,
	`is_placeholder` integer DEFAULT false NOT NULL,
	`is_organization` integer DEFAULT false NOT NULL,
	`credentials` text DEFAULT '[]' NOT NULL,
	`same_as` text DEFAULT '[]' NOT NULL,
	`avatar_media_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`avatar_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_slug_unique` ON `authors` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`description` text,
	`illustration` text,
	`accent` text,
	`cover_media_id` integer,
	`parent_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_sort_idx` ON `categories` (`sort_order`);--> statement-breakpoint
CREATE TABLE `community_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer,
	`illustration` text,
	`caption` text,
	`customer_name` text,
	`city` text,
	`product_id` integer,
	`is_sample` integer DEFAULT false NOT NULL,
	`consent_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text NOT NULL,
	`scope_id` integer,
	`scope_key` text,
	`featured` integer DEFAULT false NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `faqs_scope_idx` ON `faqs` (`scope`,`scope_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `glossary_terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`term` text NOT NULL,
	`original_term` text,
	`definition` text NOT NULL,
	`body` text,
	`related_post_slugs` text DEFAULT '[]' NOT NULL,
	`related_product_slugs` text DEFAULT '[]' NOT NULL,
	`same_as` text DEFAULT '[]' NOT NULL,
	`alternate_names` text DEFAULT '[]' NOT NULL,
	`pillar_post_slug` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `glossary_terms_slug_unique` ON `glossary_terms` (`slug`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer,
	`height` integer,
	`size_bytes` integer,
	`alt` text DEFAULT '' NOT NULL,
	`caption` text,
	`dominant_color` text,
	`blur_data_url` text,
	`kind` text DEFAULT 'photo' NOT NULL,
	`credit` text,
	`consent_at` integer,
	`focal_x` real,
	`focal_y` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_path_unique` ON `media` (`path`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `post_products` (
	`post_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`post_id`, `product_id`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`tldr` text DEFAULT '[]' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`format` text DEFAULT 'article' NOT NULL,
	`topic_id` integer,
	`is_pillar` integer DEFAULT false NOT NULL,
	`author_id` integer,
	`reviewer_id` integer,
	`cover_media_id` integer,
	`illustration` text,
	`age_min_months` integer,
	`age_max_months` integer,
	`reading_minutes` integer DEFAULT 5 NOT NULL,
	`ymyl` integer DEFAULT false NOT NULL,
	`sources` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`content_updated_at` integer,
	`reviewed_at` integer,
	`primary_query` text,
	`secondary_queries` text DEFAULT '[]' NOT NULL,
	`about_entities` text DEFAULT '[]' NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewer_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_status_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_topic_idx` ON `posts` (`topic_id`);--> statement-breakpoint
CREATE TABLE `product_addons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`price_toman` integer NOT NULL,
	`max_chars` integer,
	`status` text DEFAULT 'published' NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `addons_product_key_idx` ON `product_addons` (`product_id`,`key`);--> statement-breakpoint
CREATE TABLE `product_media` (
	`product_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`product_id`, `media_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_relations` (
	`product_id` integer NOT NULL,
	`related_id` integer NOT NULL,
	`kind` text DEFAULT 'related' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`product_id`, `related_id`, `kind`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`price` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`options` text DEFAULT '{}' NOT NULL,
	`swatch` text,
	`url_param` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sku` text,
	`price` integer NOT NULL,
	`compare_at_price` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`availability` text DEFAULT 'in_stock' NOT NULL,
	`lead_time_days` integer,
	`age_min_months` integer,
	`age_max_months` integer,
	`skills` text DEFAULT '[]' NOT NULL,
	`material` text,
	`finish` text,
	`dimensions` text,
	`weight_kg` real,
	`max_load_kg` real,
	`highlights` text DEFAULT '[]' NOT NULL,
	`specs` text DEFAULT '[]' NOT NULL,
	`in_the_box` text DEFAULT '[]' NOT NULL,
	`safety_notes` text,
	`care_notes` text,
	`warranty_months` integer,
	`assembly_minutes` integer,
	`primary_query` text,
	`alternate_names` text DEFAULT '[]' NOT NULL,
	`guarantee_text` text,
	`torob_enabled` integer DEFAULT true NOT NULL,
	`illustration` text,
	`featured` integer DEFAULT false NOT NULL,
	`is_new` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`,`sort_order`);--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301 NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_from_idx` ON `redirects` (`from_path`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`author_name` text NOT NULL,
	`city` text,
	`child_age` text,
	`rating` integer NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`media_id` integer,
	`verified_purchase` integer DEFAULT false NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`consent_at` integer,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`,`status`);--> statement-breakpoint
CREATE TABLE `room_preset_items` (
	`preset_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer,
	`slot` text NOT NULL,
	`default_on` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`preset_id`, `product_id`),
	FOREIGN KEY (`preset_id`) REFERENCES `room_presets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `room_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`age_stage` text,
	`tagline` text,
	`description` text DEFAULT '' NOT NULL,
	`floor_area_m_2` real,
	`illustration` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`primary_query` text,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_presets_slug_unique` ON `room_presets` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`description` text,
	`illustration` text,
	`accent` text,
	`same_as` text DEFAULT '[]' NOT NULL,
	`pillar_post_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`canonical_path` text,
	`noindex` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_unique` ON `topics` (`slug`);--> statement-breakpoint
CREATE TABLE `workshop_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage` text NOT NULL,
	`body` text NOT NULL,
	`count` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
