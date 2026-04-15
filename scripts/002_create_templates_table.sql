-- Create item_templates table for quick item selection
CREATE TABLE IF NOT EXISTS item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on name to avoid duplicate templates
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_name ON item_templates(LOWER(name));

-- Create index for ordering by recent
CREATE INDEX IF NOT EXISTS idx_templates_created ON item_templates(created_at DESC);

-- Enable RLS (but allow public access for this simple app without auth)
ALTER TABLE item_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read templates" ON item_templates;
DROP POLICY IF EXISTS "Allow public insert templates" ON item_templates;
DROP POLICY IF EXISTS "Allow public delete templates" ON item_templates;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read templates" ON item_templates FOR SELECT USING (true);
CREATE POLICY "Allow public insert templates" ON item_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete templates" ON item_templates FOR DELETE USING (true);
