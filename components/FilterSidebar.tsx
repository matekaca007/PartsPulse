"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterSidebarProps {
  categories: string[];
  currentCategory: string | null;
  currentSearch: string | null;
  currentSort: string | null;
  totalCount: number;
}

export function FilterSidebar({
  categories,
  currentCategory,
  currentSearch,
  currentSort,
  totalCount,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const sortOptions = [
    { value: "", label: "Default" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "title_asc", label: "Name: A → Z" },
    { value: "title_desc", label: "Name: Z → A" },
    { value: "newest", label: "Newest First" },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div
        className="rounded-xl p-5 sticky top-20"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface-border)",
        }}
      >
        {/* Result count */}
        <div className="mb-5">
          <p className="text-xs font-medium" style={{ color: "var(--foreground-subtle)" }}>
            Showing
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {totalCount.toLocaleString()}{" "}
            <span className="text-sm font-normal" style={{ color: "var(--foreground-muted)" }}>
              products
            </span>
          </p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--foreground-subtle)" }}
          >
            Search
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Search products..."
            defaultValue={currentSearch || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value;
                updateParam("search", value || null);
              }
            }}
            id="filter-search"
          />
        </div>

        {/* Sort */}
        <div className="mb-5">
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--foreground-subtle)" }}
          >
            Sort By
          </label>
          <select
            className="input-field cursor-pointer"
            value={currentSort || ""}
            onChange={(e) => updateParam("sort", e.target.value || null)}
            id="filter-sort"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-5">
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--foreground-subtle)" }}
            >
              Category
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => updateParam("category", null)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: !currentCategory ? "var(--accent-glow)" : "transparent",
                  color: !currentCategory ? "var(--accent-hover)" : "var(--foreground-muted)",
                }}
                id="filter-category-all"
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    updateParam("category", currentCategory === cat ? null : cat)
                  }
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all truncate"
                  style={{
                    background: currentCategory === cat ? "var(--accent-glow)" : "transparent",
                    color:
                      currentCategory === cat
                        ? "var(--accent-hover)"
                        : "var(--foreground-muted)",
                  }}
                  id={`filter-category-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear all */}
        {(currentCategory || currentSearch || currentSort) && (
          <button
            onClick={() => router.push("/products")}
            className="w-full btn-secondary text-xs"
            id="filter-clear-all"
          >
            ✕ Clear All Filters
          </button>
        )}
      </div>
    </aside>
  );
}
