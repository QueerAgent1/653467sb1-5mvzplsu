/*
  # Add memories table for Elektra personality

  1. New Tables
    - `memories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `context` (text)
      - `category` (text)
      - `sentiment` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  context text NOT NULL,
  category text NOT NULL,
  sentiment numeric NOT NULL CHECK (sentiment >= 0 AND sentiment <= 1),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own memories"
  ON memories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own memories"
  ON memories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_memories_user_category ON memories(user_id, category);
CREATE INDEX idx_memories_sentiment ON memories(sentiment);