import { notFound } from "next/navigation";
import Link from "next/link";
import { createAnonSupabaseClient } from "@/lib/supabase/server";
import { ImageGallery } from "@/components/ImageGallery";
import { VariantSelector } from "@/components/VariantSelector";
import type { Metadata } from "next";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonSupabaseClient();
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
  const supabase = createAnonSupabaseClient();

  // Fetch product with relations
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      source_sites ( slug, name, base_url ),
      product_images ( id, src, alt_text, position ),
      product_variants ( id, source_variant_id, title, sku, price, compare_at_price, currency, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value, is_available, position )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !product) {
    notFound();
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

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            {product.title}
          </h1>



          {/* Variant selector (includes price) */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              currency={product.currency || "USD"}
            />
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 12).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs"
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
