require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const IMAGES_DIR = path.resolve(__dirname, "images");
const MAP_FILE = path.resolve(__dirname, "image_map.json");
const BUCKET_NAME = "product-images";

async function main() {
  const imageMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  let updatedCount = 0;

  for (const [skuBase, imgFileName] of Object.entries(imageMap)) {
    // The SKU in the map might be "LMBRWS009", but in DB it could be "LMBRWS009" or variants.
    // If it's a base SKU that has variants (e.g. LMBRWS009-A, -B, etc.), we can apply the same image to all of them if the specific one wasn't mapped, 
    // but the coordinate mapping actually grabbed the base SKU text. Let's find products that start with this skuBase.
    
    // Actually, in the PDF, variants like "- A" might have been picked up as a separate text block or together. Let's see how they were captured in the DB.
    // In DB we have source_product_id. We'll search by matching source_product_id.
    
    // Exact match first
    let { data: products } = await supabase
      .from("products")
      .select("id, source_product_id, title")
      .ilike("source_product_id", `${skuBase}%`); // grabs LMBRWS009, LMBRWS009-A, etc.

    if (!products || products.length === 0) {
      console.warn(`No DB product found for mapped SKU: ${skuBase}`);
      continue;
    }

    const imgPath = path.join(IMAGES_DIR, imgFileName);
    const imgBuf = fs.readFileSync(imgPath);
    
    for (const p of products) {
      const storagePath = `luma/${p.source_product_id}-${imgFileName}`;
      
      console.log(`Uploading fixed image for ${p.source_product_id}...`);
      
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imgBuf, { upsert: true });
        
      if (uploadErr) {
        console.error(`Upload error for ${p.source_product_id}:`, uploadErr);
        continue;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);
        
      const imageUrl = publicUrlData.publicUrl;
      
      // Delete old images
      await supabase.from("product_images").delete().eq("product_id", p.id);
      
      // Insert new
      await supabase.from("product_images").insert({
        product_id: p.id,
        source_image_id: `${p.source_product_id}-main`,
        src: imageUrl,
        alt_text: p.title,
        position: 1,
      });
      
      console.log(`Fixed image link for ${p.source_product_id}`);
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Successfully re-mapped and updated ${updatedCount} product images based on PDF coordinates!`);
}

main().catch(console.error);
