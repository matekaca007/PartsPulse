/**
 * POST /api/import?adapter=<adapter_key>
 *
 * Webhook endpoint for triggering product imports.
 * Used by n8n scheduled workflows or manual API calls.
 *
 * Authentication: Bearer token matching IMPORT_API_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdapter, listAdapterKeys } from "@/lib/importers/adapters/registry";
import { upsertProducts } from "@/lib/importers/upsert";

export const maxDuration = 300; // Allow up to 5 minutes for large imports

export async function POST(request: NextRequest) {
  // ─── Auth check ─────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.IMPORT_API_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "IMPORT_API_SECRET not configured on server" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─── Adapter key ────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const adapterKey = searchParams.get("adapter");

  if (!adapterKey) {
    return NextResponse.json(
      {
        error: "Missing ?adapter= query param",
        available: listAdapterKeys(),
      },
      { status: 400 }
    );
  }

  // ─── Run import ─────────────────────────────────────────
  try {
    const adapter = getAdapter(adapterKey);
    const result = await upsertProducts(adapterKey, adapter.fetchProducts());

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[api/import] Error for adapter "${adapterKey}":`, message);

    return NextResponse.json(
      { error: message, adapterKey },
      { status: 500 }
    );
  }
}
