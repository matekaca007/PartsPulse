/**
 * Generic Upsert Function
 *
 * Consumes NormalizedProduct objects from any adapter and upserts
 * them into Supabase. Keyed on (source_site_id, source_product_id)
 * so re-running an import updates existing rows instead of duplicating.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedProduct, ImportResult } from "./types";

// Use `any` for the database generic since we don't have generated types.
// Once you run `supabase gen types typescript` you can replace this with
// the generated Database type for full type safety.
type SupabaseAdmin = SupabaseClient<any, "public", any>;

// ─── Supabase admin client (service role key for server-side ops) ─

function getSupabaseAdmin(): SupabaseAdmin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient<any>(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Upsert a single product + its images and variants ───────

async function upsertOneProduct(
  supabase: SupabaseAdmin,
  sourceSiteId: string,
  product: NormalizedProduct
): Promise<void> {
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  const priceMin = prices.length > 0 ? Math.min(...prices) : null;
  const priceMax = prices.length > 0 ? Math.max(...prices) : null;

  // 1. Upsert the product row
  const { data: upsertedProduct, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        source_site_id: sourceSiteId,
        source_product_id: product.sourceProductId,
        source_url: product.sourceUrl,
        title: product.title,
        slug: product.slug,
        description_html: product.descriptionHtml,
        vendor: product.vendor,
        category: product.category,
        tags: product.tags,
        price_min: priceMin,
        price_max: priceMax,
        currency: product.currency,
        is_available: product.isAvailable,
        raw_data: product.rawData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "source_site_id,source_product_id",
      }
    )
    .select("id")
    .single();

  if (productError || !upsertedProduct) {
    throw new Error(
      `Failed to upsert product "${product.title}": ${productError?.message}`
    );
  }

  const productId = upsertedProduct.id;

  // 2. Replace images: delete old, insert current
  await supabase.from("product_images").delete().eq("product_id", productId);

  if (product.images.length > 0) {
    const imageRows = product.images.map((img) => ({
      product_id: productId,
      source_image_id: img.sourceImageId,
      src: img.src,
      alt_text: img.altText,
      position: img.position,
      width: img.width,
      height: img.height,
    }));

    const { error: imgError } = await supabase
      .from("product_images")
      .insert(imageRows);

    if (imgError) {
      console.warn(
        `[upsert] Warning: failed to insert images for "${product.title}": ${imgError.message}`
      );
    }
  }

  // 3. Replace variants: delete old, insert current
  await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (product.variants.length > 0) {
    const variantRows = product.variants.map((v) => ({
      product_id: productId,
      source_variant_id: v.sourceVariantId,
      title: v.title,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compareAtPrice,
      currency: v.currency,
      option1_name: v.option1Name,
      option1_value: v.option1Value,
      option2_name: v.option2Name,
      option2_value: v.option2Value,
      option3_name: v.option3Name,
      option3_value: v.option3Value,
      is_available: v.isAvailable,
      inventory_quantity: v.inventoryQuantity,
      position: v.position,
      image_src: v.imageSrc,
    }));

    const { error: varError } = await supabase
      .from("product_variants")
      .insert(variantRows);

    if (varError) {
      console.warn(
        `[upsert] Warning: failed to insert variants for "${product.title}": ${varError.message}`
      );
    }
  }
}

// ─── Main upsert orchestrator ────────────────────────────────

const BATCH_LOG_INTERVAL = 25;

export async function upsertProducts(
  adapterKey: string,
  products: AsyncGenerator<NormalizedProduct, void, unknown>
): Promise<ImportResult> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  // Look up the source site by adapter_key
  const { data: sourceSite, error: siteError } = await supabase
    .from("source_sites")
    .select("id")
    .eq("adapter_key", adapterKey)
    .single();

  if (siteError || !sourceSite) {
    throw new Error(
      `Source site not found for adapter_key "${adapterKey}". ` +
        `Make sure it exists in the source_sites table. Error: ${siteError?.message}`
    );
  }

  const sourceSiteId = sourceSite.id;
  let totalProducts = 0;
  let upsertedProducts = 0;
  const errors: ImportResult["errors"] = [];

  for await (const product of products) {
    totalProducts++;

    try {
      await upsertOneProduct(supabase, sourceSiteId, product);
      upsertedProducts++;

      if (upsertedProducts % BATCH_LOG_INTERVAL === 0) {
        console.log(`[upsert] Progress: ${upsertedProducts} products upserted`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[upsert] Error on product ${product.sourceProductId}: ${message}`
      );
      errors.push({ sourceProductId: product.sourceProductId, error: message });
    }
  }

  // Update last_synced_at on the source site
  await supabase
    .from("source_sites")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", sourceSiteId);

  const result: ImportResult = {
    adapterKey,
    totalProducts,
    upsertedProducts,
    errors,
    durationMs: Date.now() - startTime,
  };

  console.log(
    `[upsert] Done: ${upsertedProducts}/${totalProducts} products upserted ` +
      `(${errors.length} errors) in ${result.durationMs}ms`
  );

  return result;
}
