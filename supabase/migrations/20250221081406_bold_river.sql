/*
  # AI Response Caching and Analytics Schema

  1. New Tables
    - `ai_responses`
      - Stores cached responses and analytics data
      - Includes prompt hash for efficient lookups
      - Tracks usage metrics per provider
    
  2. Security
    - Enable RLS on `ai_responses` table
    - Add policies for read/write access
*/

CREATE TABLE IF NOT EXISTS ai_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text NOT NULL,
  prompt text NOT NULL,
  content_type text NOT NULL,
  provider text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_prompt_hash ON ai_responses(prompt_hash);

ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
  ON ai_responses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow service role write access"
  ON ai_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);