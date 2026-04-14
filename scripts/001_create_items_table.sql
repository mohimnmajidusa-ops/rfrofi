-- Create items table for food/grocery inventory
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  weight DECIMAL,
  weight_unit TEXT DEFAULT 'g',
  quantity INTEGER NOT NULL DEFAULT 1,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_expiration ON items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);

-- Enable RLS (but allow public access for this simple app without auth)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON items;
DROP POLICY IF EXISTS "Allow public insert" ON items;
DROP POLICY IF EXISTS "Allow public update" ON items;
DROP POLICY IF EXISTS "Allow public delete" ON items;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON items FOR DELETE USING (true);
