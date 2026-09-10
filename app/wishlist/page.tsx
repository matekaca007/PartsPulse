import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'სურვილების სია / Wishlist — PartsPulse',
  description: 'Your saved products',
}

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/wishlist')
  }

  // Fetch wishlists with joined product data
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select(`
      product_id,
      products (
        id,
        slug,
        title,
        category,
        price_min,
        price_max,
        currency,
        is_available,
        product_images ( src, alt_text, position )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedProducts = wishlists
    ?.map(w => w.products)
    .filter(Boolean) || []

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          სურვილების სია / Wishlist
        </h1>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Your saved products
        </p>
      </div>

      {savedProducts.length > 0 ? (
        <div className="product-grid">
          {savedProducts.map((product: any, index: number) => {
            const firstImage = product.product_images
              ?.sort((a: any, b: any) => a.position - b.position)?.[0]

            return (
              <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  category={product.category}
                  priceMin={product.price_min}
                  priceMax={product.price_max}
                  currency={product.currency}
                  imageSrc={firstImage?.src || null}
                  imageAlt={firstImage?.alt_text || null}
                  isAvailable={product.is_available}
                  isWishlisted={true} // It's in the wishlist
                  isLoggedIn={true}
                />
              </div>
            )
          })}
        </div>
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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Your wishlist is empty
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            Save items you like by clicking the heart icon on any product.
          </p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      )}
    </div>
  )
}
