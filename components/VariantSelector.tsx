"use client";

import { useState, useMemo } from "react";

interface Variant {
  id: string;
  title: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  option1Name: string | null;
  option1Value: string | null;
  option2Name: string | null;
  option2Value: string | null;
  option3Name: string | null;
  option3Value: string | null;
  isAvailable: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  currency: string;
}

export function VariantSelector({ variants, currency }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );

  // Build option groups
  const optionGroups = useMemo(() => {
    const groups: Array<{ name: string; values: string[] }> = [];

    const opt1Name = variants[0]?.option1Name;
    const opt2Name = variants[0]?.option2Name;
    const opt3Name = variants[0]?.option3Name;

    if (opt1Name) {
      const values = [...new Set(variants.map((v) => v.option1Value).filter(Boolean))] as string[];
      groups.push({ name: opt1Name, values });
    }
    if (opt2Name) {
      const values = [...new Set(variants.map((v) => v.option2Value).filter(Boolean))] as string[];
      groups.push({ name: opt2Name, values });
    }
    if (opt3Name) {
      const values = [...new Set(variants.map((v) => v.option3Value).filter(Boolean))] as string[];
      groups.push({ name: opt3Name, values });
    }

    return groups;
  }, [variants]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);

  // If only one variant with title "Default Title", don't show selector
  const isSingleDefault =
    variants.length === 1 &&
    (variants[0].title === "Default Title" || !variants[0].title);

  if (!selectedVariant) return null;

  return (
    <div className="space-y-5">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold" style={{
          background: "var(--gradient-primary)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          {formatPrice(selectedVariant.price)}
        </span>
        {selectedVariant.compareAtPrice &&
          selectedVariant.compareAtPrice > selectedVariant.price && (
            <span className="price-compare text-lg">
              {formatPrice(selectedVariant.compareAtPrice)}
            </span>
          )}
      </div>

      {/* Availability */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: selectedVariant.isAvailable ? "var(--success)" : "var(--danger)",
          }}
        />
        <span className="text-sm font-medium" style={{
          color: selectedVariant.isAvailable ? "var(--success)" : "var(--danger)",
        }}>
          {selectedVariant.isAvailable ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Variant options */}
      {!isSingleDefault && optionGroups.length > 0 && (
        <div className="space-y-4">
          {optionGroups.map((group) => (
            <div key={group.name}>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--foreground-subtle)" }}
              >
                {group.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => {
                  // Find if the selected variant matches this value
                  const isSelected =
                    (group.name === selectedVariant.option1Name &&
                      value === selectedVariant.option1Value) ||
                    (group.name === selectedVariant.option2Name &&
                      value === selectedVariant.option2Value) ||
                    (group.name === selectedVariant.option3Name &&
                      value === selectedVariant.option3Value);

                  // Find the variant matching this option value
                  const matchingVariant = variants.find((v) => {
                    if (group.name === v.option1Name) return v.option1Value === value;
                    if (group.name === v.option2Name) return v.option2Value === value;
                    if (group.name === v.option3Name) return v.option3Value === value;
                    return false;
                  });

                  return (
                    <button
                      key={value}
                      onClick={() => {
                        if (matchingVariant) setSelectedVariantId(matchingVariant.id);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isSelected ? "var(--accent-glow)" : "var(--background-secondary)",
                        color: isSelected ? "var(--accent-hover)" : "var(--foreground-muted)",
                        border: isSelected
                          ? "1px solid var(--accent)"
                          : "1px solid var(--surface-border)",
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKU */}
      {selectedVariant.sku && (
        <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
          SKU: {selectedVariant.sku}
        </p>
      )}
    </div>
  );
}
