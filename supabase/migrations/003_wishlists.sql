-- 1. Create the wishlists table
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent a user from saving the same product twice
  UNIQUE(user_id, product_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only see their own wishlist items
CREATE POLICY "Users can view own wishlists" 
ON wishlists FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own wishlist items
CREATE POLICY "Users can insert own wishlists" 
ON wishlists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own wishlist items
CREATE POLICY "Users can delete own wishlists" 
ON wishlists FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create Indexes for performance
CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);
