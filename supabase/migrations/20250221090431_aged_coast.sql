/*
  # Brand Functions and Triggers

  1. Functions
    - Create functions to handle version updates for brand books and assets
  2. Triggers
    - Add triggers to automatically update versions on changes
*/

-- Functions
CREATE OR REPLACE FUNCTION update_brand_book_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_brand_asset_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_brand_book_version_trigger ON brand_books;
DROP TRIGGER IF EXISTS update_brand_asset_version_trigger ON brand_assets;

-- Create triggers
CREATE TRIGGER update_brand_book_version_trigger
BEFORE UPDATE ON brand_books
FOR EACH ROW
EXECUTE FUNCTION update_brand_book_version();

CREATE TRIGGER update_brand_asset_version_trigger
BEFORE UPDATE ON brand_assets
FOR EACH ROW
EXECUTE FUNCTION update_brand_asset_version();