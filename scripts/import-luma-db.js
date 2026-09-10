/**
 * Step 2: Upload extracted images and import products to DB
 * Run: node scripts/import-luma-db.js
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const IMAGES_DIR = path.resolve(__dirname, "images");
const PRODUCTS_JSON = path.resolve(__dirname, "luma_products.json");

async function main() {
  if (!fs.existsSync(PRODUCTS_JSON)) {
    console.error("Missing luma_products.json. Run extraction script first.");
    return;
  }
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  
  let images = [];
  if (fs.existsSync(IMAGES_DIR)) {
    images = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith(".")).sort();
  }
  console.log(`Loaded ${products.length} products and found ${images.length} extracted images.`);

  // 1. Ensure "luma-catalog" source_site exists
  const sourceSiteSlug = "luma-catalog";
  let { data: site } = await supabase
    .from("source_sites")
    .select("id")
    .eq("adapter_key", sourceSiteSlug)
    .single();

  if (!site) {
    console.log("Creating luma-catalog source site...");
    const { data: newSite, error: siteErr } = await supabase
      .from("source_sites")
      .insert({
        name: "LUMA Auto Parts",
        slug: sourceSiteSlug,
        base_url: "https://www.alibaba.com", // dummy
        platform: "custom",
        adapter_key: sourceSiteSlug,
        is_active: true,
      })
      .select("id")
      .single();

    if (siteErr) {
      console.error("Error creating source site:", siteErr);
      return;
    }
    site = newSite;
  }
  const sourceSiteId = site.id;

  // 2. Resolve "ford-bronco" vehicle_id
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("slug", "ford-bronco")
    .single();

  if (!vehicle) {
    console.error("Vehicle 'ford-bronco' not found in DB.");
    return;
  }
  const vehicleId = vehicle.id;

  // 3. Ensure bucket "product-images" exists
  const BUCKET_NAME = "product-images";
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets.some((b) => b.name === BUCKET_NAME)) {
    console.log(`Creating public bucket '${BUCKET_NAME}'...`);
    await supabase.storage.createBucket(BUCKET_NAME, { public: true });
  }

  // 4. Import products sequentially
  let importedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    
    // Naive image assignment: product[i] gets image[i] if available
    let imageUrl = null;
    if (i < images.length) {
      const imgFileName = images[i];
      const imgPath = path.join(IMAGES_DIR, imgFileName);
      const imgBuf = fs.readFileSync(imgPath);
      
      const storagePath = `luma/${p.sku}-${imgFileName}`;
      
      // Upload to Supabase
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imgBuf, { upsert: true });
        
      if (uploadErr) {
        console.warn(`Failed to upload image for ${p.sku}:`, uploadErr.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    // Upsert product
    const { data: upsertedProduct, error: prodErr } = await supabase
      .from("products")
      .upsert({
        source_site_id: sourceSiteId,
        source_product_id: p.sku,
        title: p.name,
        slug: `luma-${p.sku.toLowerCase()}`,
        vendor: "LUMA Auto Parts",
        is_available: true,
      }, { onConflict: "source_site_id,source_product_id" })
      .select("id")
      .single();

    if (prodErr) {
      console.error(`Error upserting product ${p.sku}:`, prodErr);
      continue;
    }

    const productId = upsertedProduct.id;

    // Link vehicle
    await supabase
      .from("product_vehicles")
      .upsert({ product_id: productId, vehicle_id: vehicleId });

    // Link image
    if (imageUrl) {
      await supabase.from("product_images").delete().eq("product_id", productId);
      await supabase.from("product_images").insert({
        product_id: productId,
        source_image_id: `${p.sku}-main`,
        src: imageUrl,
        alt_text: p.name,
        position: 1,
      });
    }

    importedCount++;
    process.stdout.write(`\rImported ${importedCount}/${products.length}...`);
  }

  console.log(`\n✅ Finished! Successfully imported ${importedCount} products for Ford Bronco.`);
}

main().catch(console.error);
