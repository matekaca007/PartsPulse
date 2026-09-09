/**
 * NiceCNC Adapter — Shopify products.json endpoint
 *
 * Fetches all products from nicecnc.com using the public Shopify
 * /products.json endpoint. Handles pagination automatically by
 * incrementing the page parameter until an empty array is returned.
 */

import type {
  SourceAdapter,
  NormalizedProduct,
  NormalizedImage,
  NormalizedVariant,
} from "../types";

// ─── Shopify JSON response types (partial, relevant fields only) ─

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
  width: number;
  height: number;
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
  inventory_quantity?: number;
  position: number;
  featured_image: { src: string } | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: Array<{ name: string; position: number; values: string[] }>;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// ─── Configuration ───────────────────────────────────────────

const BASE_URL = "https://www.nicecnc.com";
const PRODUCTS_ENDPOINT = `${BASE_URL}/products.json`;
const PAGE_SIZE = 250; // Shopify max per page
const REQUEST_DELAY_MS = 500; // polite delay between pages

// ─── Helpers ─────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePrice(price: string | null): number | null {
  if (!price) return null;
  const parsed = parseFloat(price);
  return isNaN(parsed) ? null : parsed;
}

function mapImage(img: ShopifyImage): NormalizedImage {
  return {
    sourceImageId: String(img.id),
    src: img.src,
    altText: img.alt,
    position: img.position,
    width: img.width,
    height: img.height,
  };
}

function mapVariant(
  variant: ShopifyVariant,
  options: ShopifyProduct["options"]
): NormalizedVariant {
  return {
    sourceVariantId: String(variant.id),
    title: variant.title,
    sku: variant.sku || null,
    price: parsePrice(variant.price) ?? 0,
    compareAtPrice: parsePrice(variant.compare_at_price),
    currency: "USD",
    option1Name: options[0]?.name ?? null,
    option1Value: variant.option1,
    option2Name: options[1]?.name ?? null,
    option2Value: variant.option2,
    option3Name: options[2]?.name ?? null,
    option3Value: variant.option3,
    isAvailable: variant.available,
    inventoryQuantity: variant.inventory_quantity ?? null,
    position: variant.position,
    imageSrc: variant.featured_image?.src ?? null,
  };
}

function mapProduct(product: ShopifyProduct): NormalizedProduct {
  const variants = product.variants.map((v) => mapVariant(v, product.options));
  const prices = variants.map((v) => v.price).filter((p) => p > 0);

  return {
    sourceProductId: String(product.id),
    sourceUrl: `${BASE_URL}/products/${product.handle}`,
    title: product.title,
    slug: product.handle,
    descriptionHtml: product.body_html || null,
    vendor: product.vendor || null,
    category: product.product_type || null,
    tags: product.tags || [],
    currency: "USD",
    isAvailable: variants.some((v) => v.isAvailable),
    rawData: product as unknown as Record<string, unknown>,
    images: product.images.map(mapImage),
    variants,
  };
}

// ─── Adapter ─────────────────────────────────────────────────

export class NiceCNCAdapter implements SourceAdapter {
  readonly adapterKey = "nicecnc";

  async *fetchProducts(): AsyncGenerator<NormalizedProduct, void, unknown> {
    let page = 1;

    while (true) {
      const url = `${PRODUCTS_ENDPOINT}?limit=${PAGE_SIZE}&page=${page}`;
      console.log(`[nicecnc] Fetching page ${page}: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `[nicecnc] HTTP ${response.status} on page ${page}: ${response.statusText}`
        );
      }

      const data: ShopifyProductsResponse = await response.json();

      if (!data.products || data.products.length === 0) {
        console.log(`[nicecnc] Page ${page} is empty — done.`);
        break;
      }

      console.log(
        `[nicecnc] Page ${page}: ${data.products.length} products found`
      );

      for (const product of data.products) {
        yield mapProduct(product);
      }

      // If we got fewer than PAGE_SIZE, this was the last page
      if (data.products.length < PAGE_SIZE) {
        console.log(`[nicecnc] Last page reached (${data.products.length} < ${PAGE_SIZE}).`);
        break;
      }

      page++;
      await delay(REQUEST_DELAY_MS);
    }
  }
}
