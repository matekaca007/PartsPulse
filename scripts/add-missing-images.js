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
const BUCKET_NAME = "product-images";

const missingProducts = [
  { sku: "LMBRDD002", name: "4 Lens Headlight" },
  { sku: "LMBRNS059", name: "4-wheel drive switch panel" },
  { sku: "LMBRNS067", name: "mat" },
  { sku: "LMBRWS009-B", name: "Roof Rack B" },
  { sku: "LMBRWS009-C", name: "Roof Rack C" },
  { sku: "LMBRWS009-D", name: "Roof Rack D" },
];

async function main() {
  const images = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith(".")).sort();
  // We used images 0 to 117 for the first 118 products.
  // We will use images 118 to 123 for these 6 products.
  
  for (let i = 0; i < missingProducts.length; i++) {
    const p = missingProducts[i];
    const imageIndex = 118 + i; // Start from the 119th image (index 118)
    
    if (imageIndex >= images.length) {
      console.log(`No more images left for ${p.sku}`);
      continue;
    }
    
    const imgFileName = images[imageIndex];
    const imgPath = path.join(IMAGES_DIR, imgFileName);
    const imgBuf = fs.readFileSync(imgPath);
    
    const storagePath = `luma/${p.sku}-${imgFileName}`;
    
    console.log(`Uploading ${imgFileName} for ${p.sku}...`);
    
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imgBuf, { upsert: true });
      
    if (uploadErr) {
      console.error(`Failed to upload image for ${p.sku}:`, uploadErr);
      continue;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
      
    const imageUrl = publicUrlData.publicUrl;
    
    // Get product ID
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("source_product_id", p.sku)
      .single();
      
    if (!product) continue;
    
    // Link image
    await supabase.from("product_images").delete().eq("product_id", product.id);
    await supabase.from("product_images").insert({
      product_id: product.id,
      source_image_id: `${p.sku}-main`,
      src: imageUrl,
      alt_text: p.name,
      position: 1,
    });
    
    console.log(`Linked image to ${p.sku}`);
  }
}

main().catch(console.error);
