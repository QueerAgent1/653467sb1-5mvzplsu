/*
  # Marketing System Tables

  1. New Tables
    - brand_books: Stores brand identity and guidelines
    - marketing_strategies: Manages marketing campaigns and strategies
    - brand_assets: Manages brand-related assets and resources
    - brand_guidelines: Stores specific brand usage guidelines

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Specific admin-only management policies

  3. Features
    - Version tracking for brand books and assets
    - Active/inactive status management
    - Comprehensive metadata storage
*/

-- Brand Books table
CREATE TABLE brand_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  tagline text NOT NULL,
  mission text NOT NULL,
  vision text NOT NULL,
  values text[] DEFAULT '{}',
  tone_of_voice jsonb NOT NULL,
  visual_identity jsonb NOT NULL,
  target_audience jsonb[] DEFAULT '{}',
  brand_messaging jsonb NOT NULL,
  communication_channels jsonb[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  version integer DEFAULT 1,
  is_active boolean DEFAULT true
);

-- Marketing Strategies table
CREATE TABLE marketing_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  objectives text[] DEFAULT '{}',
  target_metrics jsonb NOT NULL,
  channels text[] DEFAULT '{}',
  timeline jsonb NOT NULL,
  budget jsonb NOT NULL,
  campaigns text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft',
  metadata jsonb DEFAULT '{}'
);

-- Brand Assets table
CREATE TABLE brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  metadata jsonb DEFAULT '{}',
  usage_guidelines text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  version integer DEFAULT 1,
  is_active boolean DEFAULT true
);

-- Brand Guidelines table
CREATE TABLE brand_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  examples jsonb[] DEFAULT '{}',
  do_guidelines text[] DEFAULT '{}',
  dont_guidelines text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE brand_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view brand books"
  ON brand_books FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage brand books"
  ON brand_books FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to view marketing strategies"
  ON marketing_strategies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage marketing strategies"
  ON marketing_strategies FOR ALL TO authenticated
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to view brand assets"
  ON brand_assets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage brand assets"
  ON brand_assets FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to view brand guidelines"
  ON brand_guidelines FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage brand guidelines"
  ON brand_guidelines FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_brand_books_active ON brand_books(is_active);
CREATE INDEX idx_marketing_strategies_status ON marketing_strategies(status);
CREATE INDEX idx_brand_assets_type ON brand_assets(type);
CREATE INDEX idx_brand_assets_active ON brand_assets(is_active);
CREATE INDEX idx_brand_guidelines_category ON brand_guidelines(category);
CREATE INDEX idx_brand_guidelines_active ON brand_guidelines(is_active);

-- Functions
CREATE OR REPLACE FUNCTION update_brand_book_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_book_version_trigger
BEFORE UPDATE ON brand_books
FOR EACH ROW
EXECUTE FUNCTION update_brand_book_version();

CREATE OR REPLACE FUNCTION update_brand_asset_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_asset_version_trigger
BEFORE UPDATE ON brand_assets
FOR EACH ROW
EXECUTE FUNCTION update_brand_asset_version();