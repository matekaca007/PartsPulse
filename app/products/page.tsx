import { Suspense } from "react";
import { createAnonSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products — PartsPulse",
  description: "Browse our full catalog of UTV, ATV, and powersports parts.",
};

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    vehicle?: string;
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 24;

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const supabase = createAnonSupabaseClient();

  const currentVehicle  = params.vehicle  || null;
  const currentCategory = params.category || null;
  const currentSearch   = params.search   || null;
  const currentSort     = params.sort     || null;
  const currentPage     = parseInt(params.page || "1", 10);

  // ─── Fetch vehicles for sidebar ───────────────────────────
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("slug, name_en, is_universal")
    .order("sort_order");

  // ─── Fetch distinct categories ────────────────────────────
  const { data: categoryRows } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null)
    .not("category", "eq", "");

  const categories = [
    ...new Set(
      (categoryRows || [])
        .map((r: { category: string | null }) => r.category)
        .filter(Boolean) as string[]
    ),
  ].sort();

  // ─── Resolve vehicle slug → product IDs (if filtering) ───
  let vehicleProductIds: string[] | null = null;
  if (currentVehicle) {
    const { data: vehicleRow } = await supabase
      .from("vehicles")
      .select("id")
      .eq("slug", currentVehicle)
      .single();

    if (vehicleRow) {
      const { data: fitmentRows } = await supabase
        .from("product_vehicles")
        .select("product_id")
        .eq("vehicle_id", vehicleRow.id);

      vehicleProductIds = (fitmentRows ?? []).map(
        (r: { product_id: string }) => r.product_id
      );
    } else {
      // Unknown vehicle slug — return nothing
      vehicleProductIds = [];
    }
  }

  // ─── Build product query ──────────────────────────────────
  let query = supabase
    .from("products")
    .select(
      `
      id,
      slug,
      title,
      category,
      price_min,
      price_max,
      currency,
      is_available,
      product_images ( src, alt_text, position )
    `,
      { count: "exact" }
    );

  // Vehicle filter (via pre-resolved IDs)
  if (vehicleProductIds !== null) {
    if (vehicleProductIds.length === 0) {
      // No matching products — force empty result
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("id", vehicleProductIds);
    }
  }

  // Category filter
  if (currentCategory) {
    query = query.eq("category", currentCategory);
  }

  // Search filter
  if (currentSearch) {
    query = query.ilike("title", `%${currentSearch}%`);
  }

  // Sorting
  switch (currentSort) {
    case "price_asc":
      query = query.order("price_min", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_min", { ascending: false, nullsFirst: true });
      break;
    case "title_asc":
      query = query.order("title", { ascending: true });
      break;
    case "title_desc":
      query = query.order("title", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }

  // Pagination
  const from = (currentPage - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: products, count } = await query;
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Selected vehicle label for heading
  const activeVehicleLabel = currentVehicle
    ? (vehicles ?? []).find((v) => v.slug === currentVehicle)?.name_en ?? null
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <FilterSidebar
        vehicles={vehicles || []}
        categories={categories}
        currentVehicle={currentVehicle}
        currentCategory={currentCategory}
        currentSearch={currentSearch}
        currentSort={currentSort}
        totalCount={totalCount}
      />

      {/* Main grid */}
      <div className="flex-1 min-w-0">
        {/* Active vehicle banner */}
        {activeVehicleLabel && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
            style={{
              background: "var(--accent-glow)",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "var(--accent-hover)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="16" r="1" />
            </svg>
            Showing parts for <strong>{activeVehicleLabel}</strong>
          </div>
        )}

        {products && products.length > 0 ? (
          <>
            <div className="product-grid">
              {products.map((product: any, index: number) => {
                const firstImage = product.product_images
                  ?.sort((a: any, b: any) => a.position - b.position)?.[0];

                return (
                  <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard
                      slug={product.slug}
                      title={product.title}
                      category={product.category}
                      priceMin={product.price_min}
                      priceMax={product.price_max}
                      currency={product.currency}
                      imageSrc={firstImage?.src || null}
                      imageAlt={firstImage?.alt_text || null}
                      isAvailable={product.is_available}
                    />
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const page = i + 1;
                  const p = new URLSearchParams();
                  if (currentVehicle)  p.set("vehicle",  currentVehicle);
                  if (currentCategory) p.set("category", currentCategory);
                  if (currentSearch)   p.set("search",   currentSearch);
                  if (currentSort)     p.set("sort",     currentSort);
                  p.set("page", String(page));

                  return (
                    <a
                      key={page}
                      href={`/products?${p.toString()}`}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                      style={{
                        background: page === currentPage ? "var(--accent-glow)" : "var(--surface)",
                        color: page === currentPage ? "var(--accent-hover)" : "var(--foreground-muted)",
                        border: page === currentPage
                          ? "1px solid var(--accent)"
                          : "1px solid var(--surface-border)",
                      }}
                    >
                      {page}
                    </a>
                  );
                })}
                {totalPages > 10 && (
                  <span
                    className="w-10 h-10 flex items-center justify-center text-sm"
                    style={{ color: "var(--foreground-subtle)" }}
                  >
                    …
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
              style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "var(--foreground-subtle)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No products found
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
              {activeVehicleLabel
                ? `No parts found for ${activeVehicleLabel} yet.`
                : "Try adjusting your filters or search terms."}
            </p>
            <a href="/products" className="btn-primary">
              Clear Filters
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ProductsPage(props: ProductsPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Product Catalog
        </h1>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Browse our full catalog of parts.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-64 h-96 rounded-xl skeleton flex-shrink-0" />
            <div className="flex-1 product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-6 w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <ProductsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
