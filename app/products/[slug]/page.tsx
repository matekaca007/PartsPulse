import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ImageGallery } from "@/components/ImageGallery";
import { VariantSelector } from "@/components/VariantSelector";
import { WishlistButton } from "@/components/WishlistButton";
import type { Metadata } from "next";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, description_html, category")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Product Not Found" };

  // Strip HTML for description
  const plainDesc = product.description_html
    ? product.description_html.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Browse ${product.title} on PartsPulse.`;

  return {
    title: `${product.title} — PartsPulse`,
    description: plainDesc,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch product with relations
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      source_sites ( slug, name, base_url ),
      product_images ( id, src, alt_text, position ),
      product_variants ( id, source_variant_id, title, sku, price, compare_at_price, currency, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value, is_available, position ),
      product_vehicles ( vehicles ( name_en ) )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch user session and wishlist status
  const { data: { user } } = await supabase.auth.getUser();
  let isWishlisted = false;
  if (user) {
    const { data: wishlist } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single();
    if (wishlist) isWishlisted = true;
  }

  const sourceSite = Array.isArray(product.source_sites)
    ? product.source_sites[0]
    : product.source_sites;

  const images = (product.product_images || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => ({
      src: img.src,
      altText: img.alt_text,
    }));

  const variants = (product.product_variants || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((v: any) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      price: parseFloat(v.price),
      compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      currency: v.currency || product.currency || "USD",
      option1Name: v.option1_name,
      option1Value: v.option1_value,
      option2Name: v.option2_name,
      option2Value: v.option2_value,
      option3Name: v.option3_name,
      option3Value: v.option3_value,
      isAvailable: v.is_available,
    }));

  const vehicleTags = (product.product_vehicles || [])
    .map((pv: any) => pv.vehicles?.name_en)
    .filter(Boolean);

  const displayTags = Array.from(new Set([...vehicleTags, ...(product.tags || [])]));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8">
        <Link
          href="/products"
          className="transition-colors hover:underline"
          style={{ color: "var(--foreground-muted)" }}
        >
          Catalog
        </Link>
        <span style={{ color: "var(--foreground-subtle)" }}>/</span>
        {product.category && (
          <>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="transition-colors hover:underline"
              style={{ color: "var(--foreground-muted)" }}
            >
              {product.category}
            </Link>
            <span style={{ color: "var(--foreground-subtle)" }}>/</span>
          </>
        )}
        <span className="truncate" style={{ color: "var(--foreground-subtle)" }}>
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Images */}
        <div className="group">
          <ImageGallery images={images} productTitle={product.title} />
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Source badge */}
          <div className="flex items-center gap-2">

            {product.category && <span className="badge">{product.category}</span>}
          </div>

          {/* Title and Wishlist */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {product.title}
            </h1>
            <WishlistButton 
              productId={product.id}
              initialIsWishlisted={isWishlisted}
              isLoggedIn={!!user}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 border"
              showText={true}
            />
          </div>

          {/* Details (SKU, Price, Size, Weight) */}
          <div className="flex flex-col gap-1.5 text-sm mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <p>
              <span className="font-semibold text-neutral-300 w-16 inline-block">SKU:</span> 
              <span className="text-neutral-400">{product.source_product_id}</span>
            </p>
            <p>
              <span className="font-semibold text-neutral-300 w-16 inline-block">Price:</span> 
              <span className="text-neutral-400">
                {product.price_min ? `${product.currency === 'USD' ? '$' : ''}${product.price_min}` : "not available"}
              </span>
            </p>
            <p>
              <span className="font-semibold text-neutral-300 w-16 inline-block">Size:</span> 
              <span className="text-neutral-400">{product.raw_data?.size || "not available"}</span>
            </p>
            <p>
              <span className="font-semibold text-neutral-300 w-16 inline-block">Weight:</span> 
              <span className="text-neutral-400">{product.raw_data?.weight || "not available"}</span>
            </p>
          </div>

          {/* Variant selector (includes price) */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              currency={product.currency || "USD"}
            />
          )}

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.slice(0, 12).map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    background: "var(--background-secondary)",
                    color: "var(--foreground-subtle)",
                    border: "1px solid var(--surface-border)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}


        </div>
      </div>

      {/* Description */}
      {product.description_html && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
            Description
          </h2>
          <div
            className="prose prose-invert max-w-none text-sm leading-relaxed"
            style={{ color: "var(--foreground-muted)" }}
            dangerouslySetInnerHTML={{ 
              __html: product.description_html
                .replace(/<img[^>]*>/gi, "")
                .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
                .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "")
                .replace(/nicecnc/gi, "PartsPulse")
            }}
          />
        </section>
      )}
    </div>
  );
}
