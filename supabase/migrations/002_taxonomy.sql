-- ============================================================
-- Migration 002 — Taxonomy: Vehicles & Structured Categories
-- ============================================================
-- Run this AFTER 001_initial_schema.sql.
-- It adds vehicle fitment, a two-level category hierarchy,
-- and a many-to-many junction table, then seeds all reference data.
-- ============================================================

-- ── 1. CATEGORIES ────────────────────────────────────────────
-- Self-referencing table.
-- parent_id IS NULL  →  super-category (4 rows)
-- parent_id NOT NULL →  sub-category   (15 rows)

CREATE TABLE categories (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT    UNIQUE NOT NULL,   -- URL-friendly English only
  name_en     TEXT    NOT NULL,
  name_ka     TEXT    NOT NULL,          -- Georgian label
  parent_id   UUID    REFERENCES categories(id) ON DELETE CASCADE,
  sort_order  INT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug   ON categories(slug);

-- ── 2. Add category FK columns to products ───────────────────
-- Keep old "category TEXT" for backward-compat during migration;
-- it can be dropped once the UI fully uses the new FK columns.

ALTER TABLE products
  ADD COLUMN super_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN sub_category_id   UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_super_category ON products(super_category_id);
CREATE INDEX idx_products_sub_category   ON products(sub_category_id);

-- ── 3. VEHICLES ───────────────────────────────────────────────

CREATE TABLE vehicles (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT    UNIQUE NOT NULL,
  name_en      TEXT    NOT NULL,
  name_ka      TEXT    NOT NULL,
  is_universal BOOLEAN NOT NULL DEFAULT false, -- true only for "Universal Fit"
  sort_order   INT     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehicles_slug ON vehicles(slug);

-- ── 4. PRODUCT_VEHICLES (many-to-many junction) ───────────────

CREATE TABLE product_vehicles (
  product_id  UUID NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id)  ON DELETE CASCADE,
  PRIMARY KEY (product_id, vehicle_id)
);

CREATE INDEX idx_product_vehicles_vehicle ON product_vehicles(vehicle_id);
CREATE INDEX idx_product_vehicles_product ON product_vehicles(product_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Super-categories ─────────────────────────────────────────

INSERT INTO categories (slug, name_en, name_ka, parent_id, sort_order) VALUES
  ('mechanical-drivetrain',  'Mechanical & Drivetrain',  'მექანიკური & სამძრავლო',       NULL, 1),
  ('exterior-protection',    'Exterior & Protection',    'გარე & დაცვა',                  NULL, 2),
  ('electronics-power',      'Electronics & Power',      'ელექტრონიკა & კვება',            NULL, 3),
  ('recovery-adventure',     'Recovery & Adventure',     'გამოსვლა & სათავგადასავლო',     NULL, 4);

-- ── Sub-categories — Mechanical & Drivetrain ─────────────────

INSERT INTO categories (slug, name_en, name_ka, parent_id, sort_order)
SELECT
  sub.slug, sub.name_en, sub.name_ka,
  (SELECT id FROM categories WHERE slug = 'mechanical-drivetrain'),
  sub.sort_order
FROM (VALUES
  ('suspension-shock-absorbers',    'Suspension Systems & Shock Absorbers',  'შეჩერება & ამორტიზატორები',             1),
  ('differential-lockers-axles',    'Differential Lockers & Axles',          'დიფერენციალის საკეტები & ღერძები',      2),
  ('hydraulic-bump-stops-straps',   'Hydraulic Bump Stops & Limit Straps',   'ჰიდრავლიკური ამსორბლები & სარტყლები',  3),
  ('heavy-duty-steering',           'Heavy-Duty Steering Components',         'გაძლიერებული საჭის კომპონენტები',       4)
) AS sub(slug, name_en, name_ka, sort_order);

-- ── Sub-categories — Exterior & Protection ───────────────────

INSERT INTO categories (slug, name_en, name_ka, parent_id, sort_order)
SELECT
  sub.slug, sub.name_en, sub.name_ka,
  (SELECT id FROM categories WHERE slug = 'exterior-protection'),
  sub.sort_order
FROM (VALUES
  ('bumpers-body-armor',    'Heavy-Duty Bumpers & Body Armor',        'მძიმე ბამპერები & სხეულის ჯავშანი',  1),
  ('body-panels-fenders',   'Composite Body Panels & Fenders',        'კომპოზიტური პანელები & ფარდები',     2),
  ('wheels-tires',          'Wheels & Mud-Terrain Tires',             'დისკები & მდელოს საბურავები',         3),
  ('roof-racks-cargo',      'Roof Racks & Cargo Solutions',           'სახურავის თარო & ტვირთის გადაწყვეტა', 4)
) AS sub(slug, name_en, name_ka, sort_order);

-- ── Sub-categories — Electronics & Power ─────────────────────

INSERT INTO categories (slug, name_en, name_ka, parent_id, sort_order)
SELECT
  sub.slug, sub.name_en, sub.name_ka,
  (SELECT id FROM categories WHERE slug = 'electronics-power'),
  sub.sort_order
FROM (VALUES
  ('led-lighting-optics',       'LED Auxiliary Lighting & Optics',         'LED დამხმარე განათება & ოპტიკა',          1),
  ('dual-battery-power',        'Dual-Battery Systems & Power Management', 'ორმაგი ბატარეა & სიმძლავრის მართვა',     2),
  ('navigation-communication',  'Navigation & Communication Devices',      'ნავიგაცია & საკომუნიკაციო მოწყობილობები', 3),
  ('air-compressors-onboard',   'Air Compressors & On-Board Systems',      'კომპრესორები & ბორტზე სისტემები',        4)
) AS sub(slug, name_en, name_ka, sort_order);

-- ── Sub-categories — Recovery & Adventure ────────────────────

INSERT INTO categories (slug, name_en, name_ka, parent_id, sort_order)
SELECT
  sub.slug, sub.name_en, sub.name_ka,
  (SELECT id FROM categories WHERE slug = 'recovery-adventure'),
  sub.sort_order
FROM (VALUES
  ('winches-recovery',    'Winches & Recovery Gear',          'ლებედები & გამოყვანის აღჭურვილობა',  1),
  ('snorkels-air-intake', 'Snorkels & Air Intake Systems',    'სნორკელები & ჰაერის მიღების სისტემა', 2),
  ('camping-overlanding', 'Camping & Overlanding Gear',       'კემპინგი & ოვერლენდინგის აღჭურვილობა', 3)
) AS sub(slug, name_en, name_ka, sort_order);

-- ── Vehicles ─────────────────────────────────────────────────

INSERT INTO vehicles (slug, name_en, name_ka, is_universal, sort_order) VALUES
  ('jeep-wrangler',         'Jeep Wrangler',               'ჯიპ რენგლერი',            false,  1),
  ('jeep-gladiator',        'Jeep Gladiator',              'ჯიპ გლადიატორი',          false,  2),
  ('toyota-land-cruiser',   'Toyota Land Cruiser',         'ტოიოტა ლენდ კრუიზერი',   false,  3),
  ('toyota-4runner',        'Toyota 4Runner',              'ტოიოტა 4რანერი',          false,  4),
  ('ford-bronco',           'Ford Bronco',                 'ფორდ ბრონქო',             false,  5),
  ('ford-f150-raptor',      'Ford F-150 Raptor',           'ფორდ F-150 რაპტორი',      false,  6),
  ('land-rover-defender',   'Land Rover Defender',         'ლენდ როვერ დიფენდერი',   false,  7),
  ('mercedes-g-class',      'Mercedes-Benz G-Class',       'მერსედეს-ბენცი G-კლასი', false,  8),
  ('suzuki-jimny',          'Suzuki Jimny',                'სუზუკი ჯიმნი',           false,  9),
  ('nissan-patrol',         'Nissan Patrol',               'ნისანი პატროლი',          false, 10),
  ('ram-1500-trx',          'RAM 1500 TRX',                'RAM 1500 TRX',            false, 11),
  ('utv-atv',               'UTV/ATV (Can-Am, Polaris, Honda)', 'UTV/ATV (Can-Am, Polaris, Honda)', false, 12),
  ('universal-fit',         'Universal Fit',               'უნივერსალური',            true,  13);
