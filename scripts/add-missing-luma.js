require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const missingProducts = [
  { sku: "LMBRDD002", name: "4 Lens Headlight" },
  { sku: "LMBRNS059", name: "4-wheel drive switch panel" },
  { sku: "LMBRNS067", name: "mat" },
  { sku: "LMBRWS009-B", name: "Roof Rack B" },
  { sku: "LMBRWS009-C", name: "Roof Rack C" },
  { sku: "LMBRWS009-D", name: "Roof Rack D" },
];

async function main() {
  const sourceSiteSlug = "luma-catalog";
  const { data: site } = await supabase
    .from("source_sites")
    .select("id")
    .eq("adapter_key", sourceSiteSlug)
    .single();
  const sourceSiteId = site.id;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("slug", "ford-bronco")
    .single();
  const vehicleId = vehicle.id;

  for (const p of missingProducts) {
    const { data: upsertedProduct, error } = await supabase
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

    if (error) {
      console.error(`Error upserting ${p.sku}:`, error);
      continue;
    }

    await supabase
      .from("product_vehicles")
      .upsert({ product_id: upsertedProduct.id, vehicle_id: vehicleId });

    console.log(`Added missing product: [${p.sku}] ${p.name}`);
  }
}

main().catch(console.error);
