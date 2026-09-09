-- ============================================================
-- Multi-Source E-Commerce Catalog Aggregator — Initial Schema
-- ============================================================

-- 1. Source Sites Registry
-- Each row represents an external e-commerce store we import from.
CREATE TABLE source_sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  base_url        TEXT NOT NULL,
  platform        TEXT NOT NULL,           -- 'shopify' | 'woocommerce' | 'custom'
  adapter_key     TEXT NOT NULL,           -- matches SourceAdapter.adapterKey
  is_active       BOOLEAN DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Products
-- Normalized product rows from any source site.
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_site_id    UUID NOT NULL REFERENCES source_sites(id) ON DELETE CASCADE,
  source_product_id TEXT NOT NULL,
  source_url        TEXT,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description_html  TEXT,
  vendor            TEXT,
  category          TEXT,
  tags              TEXT[],
  price_min         NUMERIC(10,2),
  price_max         NUMERIC(10,2),
  currency          TEXT DEFAULT 'USD',
  is_available      BOOLEAN DEFAULT true,
  raw_data          JSONB,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (source_site_id, source_product_id)
);

CREATE INDEX idx_products_category   ON products(category);
CREATE INDEX idx_products_source     ON products(source_site_id);
CREATE INDEX idx_products_price      ON products(price_min, price_max);
CREATE INDEX idx_products_slug       ON products(slug);
CREATE INDEX idx_products_available  ON products(is_available) WHERE is_available = true;

-- 3. Product Images
CREATE TABLE product_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_image_id TEXT,
  src             TEXT NOT NULL,
  alt_text        TEXT,
  position        INT DEFAULT 0,
  width           INT,
  height          INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_images_product ON product_images(product_id);

-- 4. Product Variants
CREATE TABLE product_variants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_variant_id   TEXT,
  title               TEXT,
  sku                 TEXT,
  price               NUMERIC(10,2) NOT NULL,
  compare_at_price    NUMERIC(10,2),
  currency            TEXT DEFAULT 'USD',
  option1_name        TEXT,
  option1_value       TEXT,
  option2_name        TEXT,
  option2_value       TEXT,
  option3_name        TEXT,
  option3_value       TEXT,
  is_available        BOOLEAN DEFAULT true,
  inventory_quantity  INT,
  position            INT DEFAULT 0,
  image_src           TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ============================================================
-- Seed: Insert the first source site (NiceCNC)
-- ============================================================
INSERT INTO source_sites (slug, name, base_url, platform, adapter_key)
VALUES ('nicecnc', 'NiceCNC', 'https://www.nicecnc.com', 'shopify', 'nicecnc');
