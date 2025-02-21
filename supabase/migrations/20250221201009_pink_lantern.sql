-- Create RSS Articles table
CREATE TABLE IF NOT EXISTS rss_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid,
  title text NOT NULL,
  content text,
  url text NOT NULL,
  published_at timestamptz,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create Trends table
CREATE TABLE IF NOT EXISTS trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  category text NOT NULL,
  source_urls text[] DEFAULT '{}',
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  mention_count integer DEFAULT 1,
  sentiment_score decimal(3,2),
  related_keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rss_articles_keywords ON rss_articles USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends(keyword);
CREATE INDEX IF NOT EXISTS idx_trends_category ON trends(category);
CREATE INDEX IF NOT EXISTS idx_trends_last_seen ON trends(last_seen);

-- Enable RLS
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read access to RSS articles"
  ON rss_articles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to trends"
  ON trends FOR SELECT TO authenticated
  USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_trend_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update related keywords based on co-occurrence
  WITH co_occurring_keywords AS (
    SELECT 
      UNNEST(keywords) as related_keyword,
      COUNT(*) as occurrence_count
    FROM rss_articles
    WHERE 
      keywords @> ARRAY[NEW.keyword]
      AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
    GROUP BY related_keyword
    ORDER BY occurrence_count DESC
    LIMIT 5
  )
  UPDATE trends
  SET 
    related_keywords = ARRAY(SELECT related_keyword FROM co_occurring_keywords),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_trend_metrics_trigger ON trends;

-- Create trigger
CREATE TRIGGER update_trend_metrics_trigger
AFTER INSERT OR UPDATE ON trends
FOR EACH ROW
EXECUTE FUNCTION update_trend_metrics();