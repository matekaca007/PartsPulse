/**
 * Multi-Source E-Commerce Catalog Aggregator
 * Adapter Types & Interfaces
 *
 * Every source-site importer must output data matching these shapes.
 * The upsert function consumes NormalizedProduct objects regardless
 * of which adapter produced them.
 */

// ─── Taxonomy Types ──────────────────────────────────────────

/**
 * A category row from the `categories` table.
 * parent_id = null → super-category; parent_id = UUID → sub-category.
 */
export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameKa: string;
  parentId: string | null;
  sortOrder: number;
}

/**
 * A vehicle row from the `vehicles` table.
 * isUniversal = true only for the "Universal Fit" pseudo-vehicle.
 */
export interface Vehicle {
  id: string;
  slug: string;
  nameEn: string;
  nameKa: string;
  isUniversal: boolean;
  sortOrder: number;
}

// ─── Normalized Data Shapes ──────────────────────────────────

export interface NormalizedImage {
  sourceImageId: string | null;
  src: string;
  altText: string | null;
  position: number;
  width: number | null;
  height: number | null;
}

export interface NormalizedVariant {
  sourceVariantId: string;
  title: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  option1Name: string | null;
  option1Value: string | null;
  option2Name: string | null;
  option2Value: string | null;
  option3Name: string | null;
  option3Value: string | null;
  isAvailable: boolean;
  inventoryQuantity: number | null;
  position: number;
  imageSrc: string | null;
}

export interface NormalizedProduct {
  sourceProductId: string;
  sourceUrl: string;
  title: string;
  slug: string;
  descriptionHtml: string | null;
  vendor: string | null;
  /**
   * Raw category string from the source site (e.g. Shopify product_type).
   * Stored in products.category for legacy/search purposes.
   * Use superCategoryId / subCategoryId for structured taxonomy.
   */
  category: string | null;
  tags: string[];
  currency: string;
  isAvailable: boolean;
  rawData: Record<string, unknown>;
  images: NormalizedImage[];
  variants: NormalizedVariant[];
  /**
   * Optional: structured category FKs.
   * Adapters may populate these if they can map to the taxonomy.
   * If null, a human can assign them later via the admin UI.
   */
  superCategoryId?: string | null;
  subCategoryId?: string | null;
  /**
   * Optional: vehicle slugs this product fits.
   * e.g. ["jeep-wrangler", "universal-fit"]
   * The upsert function resolves slugs → UUIDs automatically.
   */
  vehicleSlugs?: string[];
}

// ─── Adapter Contract ────────────────────────────────────────

/**
 * The contract every source-site adapter must fulfill.
 *
 * Adapters use AsyncGenerator so they can yield products one at a time,
 * letting the caller upsert in batches without holding the entire
 * catalog in memory. This works for 10 products or 10,000.
 */
export interface SourceAdapter {
  /** Unique key matching source_sites.adapter_key in the database */
  readonly adapterKey: string;

  /**
   * Fetch ALL products from the source, handling pagination internally.
   * Yields normalized products one at a time.
   */
  fetchProducts(): AsyncGenerator<NormalizedProduct, void, unknown>;
}

// ─── Import Result ───────────────────────────────────────────

export interface ImportResult {
  adapterKey: string;
  totalProducts: number;
  upsertedProducts: number;
  errors: Array<{ sourceProductId: string; error: string }>;
  durationMs: number;
}
