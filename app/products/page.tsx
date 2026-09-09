import { Suspense } from "react";
import { createAnonSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products — PartsPulse",
  description: "Browse our full catalog of UTV, ATV, and powersports parts.",
};

// Force dynamic rendering since we use searchParams
export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    source?: string;
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

  const currentSource = params.source || null;
  const currentCategory = params.category || null;
  const currentSearch = params.search || null;
  const currentSort = params.sort || null;
  const currentPage = parseInt(params.page || "1", 10);

  // ─── Fetch source sites for filter ────────────────────────
  const { data: sources } = await supabase
    .from("source_sites")
    .select("slug, name")
    .eq("is_active", true)
    .order("name");

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

  // ─── Build product query ──────────────────────────────────
  let query = supabase
    .from("products")
    .select(
      `
      id,
      slug,
      title,
      category,
      vendor,
      price_min,
      price_max,
      currency,
      is_available,
      source_site_id,
      source_sites!inner ( slug, name ),
      product_images ( src, alt_text, position )
    `,
      { count: "exact" }
    );

  // Filters
  if (currentSource) {
    query = query.eq("source_sites.slug", currentSource);
  }
  if (currentCategory) {
    query = query.eq("category", currentCategory);
  }
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
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: products, count } = await query;
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <FilterSidebar
        sources={sources || []}
        categories={categories}
        currentSource={currentSource}
        currentCategory={currentCategory}
        currentSearch={currentSearch}
        currentSort={currentSort}
        totalCount={totalCount}
      />

      {/* Main grid */}
      <div className="flex-1 min-w-0">
        {products && products.length > 0 ? (
          <>
            <div className="product-grid">
              {products.map((product: any, index: number) => {
                const firstImage = product.product_images
                  ?.sort((a: any, b: any) => a.position - b.position)?.[0];
                const sourceSite = Array.isArray(product.source_sites)
                  ? product.source_sites[0]
                  : product.source_sites;

                return (
                  <div
                    key={product.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard
                      slug={product.slug}
                      title={product.title}
                      category={product.category}
                      vendor={product.vendor}
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
                  const params = new URLSearchParams();
                  if (currentSource) params.set("source", currentSource);
                  if (currentCategory) params.set("category", currentCategory);
                  if (currentSearch) params.set("search", currentSearch);
                  if (currentSort) params.set("sort", currentSort);
                  params.set("page", String(page));

                  return (
                    <a
                      key={page}
                      href={`/products?${params.toString()}`}
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
                  <span className="w-10 h-10 flex items-center justify-center text-sm" style={{ color: "var(--foreground-subtle)" }}>
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
              Try adjusting your filters or search terms.
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
          <div className="product-grid">
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
        }
      >
        <ProductsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
