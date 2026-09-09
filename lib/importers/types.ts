/**
 * Multi-Source E-Commerce Catalog Aggregator
 * Adapter Types & Interfaces
 *
 * Every source-site importer must output data matching these shapes.
 * The upsert function consumes NormalizedProduct objects regardless
 * of which adapter produced them.
 */

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
  category: string | null;
  tags: string[];
  currency: string;
  isAvailable: boolean;
  rawData: Record<string, unknown>;
  images: NormalizedImage[];
  variants: NormalizedVariant[];
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
