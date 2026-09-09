/**
 * Run the initial migration against Supabase using the service role key.
 * This executes raw SQL via the Supabase REST API's rpc endpoint.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function runSQL(sql: string, label: string) {
  console.log(`\n⏳ Running: ${label}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  // The rpc endpoint may not work for DDL, so let's use the SQL endpoint instead
  // We'll try the management API
  if (!response.ok) {
    // Fall back to using supabase-js
    const text = await response.text();
    console.log(`REST API response (${response.status}): ${text}`);
    return false;
  }
  return true;
}

async function main() {
  const sqlPath = path.resolve(process.cwd(), "supabase/migrations/001_initial_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("🗄️  Running migration against Supabase...");
  console.log(`   URL: ${SUPABASE_URL}`);

  // Split into individual statements and run via supabase-js
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // Split SQL by semicolons, but be careful with the INSERT that has values
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    const firstLine = stmt.split("\n").find(l => l.trim() && !l.trim().startsWith("--")) || stmt.slice(0, 60);
    console.log(`\n⏳ ${firstLine.trim().slice(0, 80)}...`);
    
    const { error } = await supabase.rpc("exec_sql", { sql_text: stmt + ";" });
    
    if (error) {
      // Try with the raw postgres approach
      console.log(`   ℹ️  RPC not available, will need to run via Supabase SQL Editor`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`   ✅ Done`);
    }
  }
}

main().catch(console.error);
