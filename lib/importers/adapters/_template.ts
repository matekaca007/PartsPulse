/**
 * Adapter Template
 *
 * Copy this file to create a new source site adapter.
 * 1. Rename the file to your-source.ts
 * 2. Implement fetchProducts() to fetch and normalize products
 * 3. Register it in registry.ts
 */

import type { SourceAdapter, NormalizedProduct } from "../types";

export class TemplateAdapter implements SourceAdapter {
  readonly adapterKey = "your-source-key";

  async *fetchProducts(): AsyncGenerator<NormalizedProduct, void, unknown> {
    // TODO: Implement your source-specific fetching logic here.
    //
    // For Shopify stores, see nicecnc.ts as a reference.
    //
    // For WooCommerce, you might use their REST API:
    //   /wp-json/wc/v3/products?per_page=100&page=N
    //
    // For custom sites, you might use Playwright:
    //   import { chromium } from 'playwright';
    //   const browser = await chromium.launch();
    //   const page = await browser.newPage();
    //   await page.goto('https://example.com/products');
    //   // ... scrape and yield NormalizedProduct objects
    //
    // Each product you yield must match the NormalizedProduct interface.

    throw new Error("TemplateAdapter.fetchProducts() is not implemented");
  }
}
