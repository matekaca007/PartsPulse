import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  slug: string;
  title: string;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  imageSrc: string | null;
  imageAlt: string | null;
  isAvailable: boolean;
}

export function ProductCard({
  slug,
  title,
  category,
  priceMin,
  priceMax,
  currency,
  imageSrc,
  imageAlt,
  isAvailable,
}: ProductCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  const priceDisplay = () => {
    if (priceMin === null) return "Price unavailable";
    if (priceMax !== null && priceMax > priceMin) {
      return `${formatPrice(priceMin)} – ${formatPrice(priceMax)}`;
    }
    return formatPrice(priceMin);
  };

  return (
    <Link
      href={`/products/${slug}`}
      className="card group block overflow-hidden animate-fade-in"
      id={`product-card-${slug}`}
    >
      {/* Image */}
      <div className="img-zoom-container relative aspect-square" style={{ background: "var(--background-secondary)" }}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              style={{ color: "var(--foreground-subtle)" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!isAvailable && (
            <span
              className="badge"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--danger)",
                borderColor: "rgba(239, 68, 68, 0.2)",
              }}
            >
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Category */}
        {category && (
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: "var(--foreground-subtle)" }}
          >
            {category}
          </p>
        )}

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-white transition-colors"
          style={{ color: "var(--foreground-muted)" }}
        >
          {title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="price-current">{priceDisplay()}</span>
        </div>
      </div>
    </Link>
  );
}
