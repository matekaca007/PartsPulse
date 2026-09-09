/**
 * CLI Import Runner
 *
 * Usage:
 *   npx tsx lib/importers/run-import.ts <adapter_key>
 *   npx tsx lib/importers/run-import.ts nicecnc
 *
 * Requires .env.local to be loaded (use dotenv or set env vars manually).
 */

import * as dotenv from "dotenv";
import path from "path";

// Load .env.local from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getAdapter, listAdapterKeys } from "./adapters/registry";
import { upsertProducts } from "./upsert";

async function main() {
  const adapterKey = process.argv[2];

  if (!adapterKey) {
    console.error("Usage: npx tsx lib/importers/run-import.ts <adapter_key>");
    console.error(`Available adapters: ${listAdapterKeys().join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting import for adapter: "${adapterKey}"\n`);

  try {
    const adapter = getAdapter(adapterKey);
    const result = await upsertProducts(adapterKey, adapter.fetchProducts());

    console.log("\n── Import Summary ──────────────────────");
    console.log(`  Adapter:     ${result.adapterKey}`);
    console.log(`  Total:       ${result.totalProducts} products fetched`);
    console.log(`  Upserted:    ${result.upsertedProducts} products saved`);
    console.log(`  Errors:      ${result.errors.length}`);
    console.log(`  Duration:    ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log("────────────────────────────────────────\n");

    if (result.errors.length > 0) {
      console.log("Errors:");
      for (const e of result.errors) {
        console.log(`  - ${e.sourceProductId}: ${e.error}`);
      }
    }

    process.exit(result.errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error("\n❌ Import failed:", err);
    process.exit(1);
  }
}

main();
