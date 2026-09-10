require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const text = fs.readFileSync(path.resolve(__dirname, "luma_raw_text.txt"), "utf8");

async function main() {
  const { data: products } = await supabase
    .from("products")
    .select("id, source_product_id")
    .eq("vendor", "LUMA Auto Parts");

  for (const product of products) {
    const sku = product.source_product_id;
    
    // We can use a regex to find the SKU, and capture everything up to the next SKU or the end of the line.
    // However, the text is somewhat unstructured, but we can search for the SKU and then look at tokens.
    // Let's normalize the text
    const tokens = text.split(/\s+/);
    
    let size = "not available";
    let weight = "not available";
    
    // Find the SKU in tokens (accounting for "- A", "- 1" etc)
    let skuIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i];
      if (t.includes(sku.replace("-", ""))) {
        skuIndex = i;
        break;
      }
      if (i < tokens.length - 2 && t === sku.split("-")[0] && tokens[i+1] === "-" && tokens[i+2] === sku.split("-")[1]) {
        skuIndex = i;
        break;
      }
    }

    if (skuIndex !== -1) {
      // Look ahead for the next 20 tokens to find size and weight
      const searchTokens = tokens.slice(skuIndex + 1, skuIndex + 25).join(" ");
      
      // Stop search if we hit the next SKU (e.g. starts with LMBR)
      const chunk = searchTokens.split(/LMBR[A-Z0-9]/)[0];
      
      // Match Size (e.g. 171*25*34, 168*30*14cm, 76 × 26 × 14cm, 4door:198*24*21 cm)
      // Including optional spaces around the asterisks/crosses.
      const sizeRegex = /(?:[A-Za-z0-9]+:)?\d+(?:\.\d+)?\s*[*x×X]\s*\d+(?:\.\d+)?\s*[*x×X]\s*\d+(?:\.\d+)?\s*(?:cm)?/i;
      const sizeMatch = chunk.match(sizeRegex);
      if (sizeMatch) {
        size = sizeMatch[0];
      }
      
      // Match Weight (e.g. 5kg, 0.4kg, 10.65KG, /2.4kg, 6.39)
      // Usually follows the size, or has 'kg' in it. Let's look for numbers followed by kg.
      const weightRegex = /\/?(\d+(?:\.\d+)?)\s*(?:kg|g|KG|g)/i;
      const weightMatch = chunk.match(weightRegex);
      if (weightMatch) {
        weight = weightMatch[1] + " kg";
      } else {
        // If no "kg", maybe just a trailing number like "6.39" that comes right after size
        if (sizeMatch) {
          const afterSize = chunk.substring(sizeMatch.index + sizeMatch[0].length).trim();
          const strayNumberMatch = afterSize.match(/^(\d+(?:\.\d+)?)/);
          if (strayNumberMatch) {
            weight = strayNumberMatch[1] + " kg";
          }
        }
      }
    }
    
    // Clean up
    size = size.replace("not available", "").trim() || "not available";
    weight = weight.replace("not available", "").trim() || "not available";

    await supabase
      .from("products")
      .update({ raw_data: { size, weight } })
      .eq("id", product.id);
      
    console.log(`${sku}: Size: ${size}, Weight: ${weight}`);
  }
}

main().catch(console.error);
