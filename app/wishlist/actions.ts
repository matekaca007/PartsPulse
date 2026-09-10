'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleWishlist(productId: string, pathname: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    // Remove it
    await supabase.from('wishlists').delete().eq('id', existing.id)
  } else {
    // Add it
    await supabase.from('wishlists').insert({
      user_id: user.id,
      product_id: productId
    })
  }

  // Revalidate the page to update server components
  revalidatePath(pathname)
  return { success: true }
}
