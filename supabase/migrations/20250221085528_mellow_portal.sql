/*
  # Content Calendar and Campaign Management

  1. New Tables
    - `campaigns`
      - Campaign planning and tracking
      - Objectives, metrics, and status
    - `content_plans`
      - Content calendar entries
      - Scheduling and organization
    - `content_analytics`
      - Performance tracking
      - Engagement metrics
  
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Campaigns table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  objectives text[] DEFAULT '{}',
  target_metrics jsonb NOT NULL DEFAULT '{}',
  budget decimal(12,2),
  status text NOT NULL DEFAULT 'planning',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'
);

-- Content Plans table
CREATE TABLE content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL,
  target_audience text[] DEFAULT '{}',
  channels text[] DEFAULT '{}',
  scheduled_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  campaign_id uuid REFERENCES campaigns(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'
);

-- Content Analytics table
CREATE TABLE content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_plans(id),
  views integer DEFAULT 0,
  engagement_rate decimal(5,4),
  conversion_rate decimal(5,4),
  revenue decimal(12,2) DEFAULT 0,
  feedback text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to manage campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow authenticated users to manage content plans"
  ON content_plans FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow authenticated users to manage content analytics"
  ON content_analytics FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE id = content_analytics.content_id
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE id = content_analytics.content_id
      AND created_by = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_date_range ON campaigns(start_date, end_date);
CREATE INDEX idx_content_plans_campaign ON content_plans(campaign_id);
CREATE INDEX idx_content_plans_schedule ON content_plans(scheduled_date);
CREATE INDEX idx_content_plans_status ON content_plans(status);
CREATE INDEX idx_content_analytics_content ON content_analytics(content_id);

-- Functions
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update campaign status based on dates
  UPDATE campaigns
  SET status = CASE
    WHEN CURRENT_TIMESTAMP < start_date THEN 'planning'
    WHEN CURRENT_TIMESTAMP BETWEEN start_date AND end_date THEN 'active'
    ELSE 'completed'
  END,
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_status_trigger
AFTER INSERT OR UPDATE OF start_date, end_date ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaign_status();