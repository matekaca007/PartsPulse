'use client'

import { useState, useTransition } from 'react'
import { toggleWishlist } from '@/app/wishlist/actions'
import { usePathname, useRouter } from 'next/navigation'

export function WishlistButton({
  productId,
  initialIsWishlisted,
  isLoggedIn,
  className,
  showText = false
}: {
  productId: string
  initialIsWishlisted: boolean
  isLoggedIn: boolean
  className?: string
  showText?: boolean
}) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    // Optimistic update
    setIsWishlisted(!isWishlisted)

    startTransition(async () => {
      const res = await toggleWishlist(productId, pathname)
      if (res?.error) {
        // Revert on error
        setIsWishlisted(isWishlisted)
      }
    })
  }

  const defaultClassName = `absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-all z-10 flex items-center justify-center ${isPending ? 'opacity-50' : 'opacity-100'}`
  const buttonClass = className !== undefined ? className : defaultClassName

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={buttonClass}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isWishlisted ? '#EF4444' : 'none'}
        stroke={isWishlisted ? '#EF4444' : 'white'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform active:scale-75 ${showText ? 'mr-2' : ''}`}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showText && (
        <span>{isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
      )}
    </button>
  )
}
