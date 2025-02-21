/*
  # Social Media and Forum System Schema with User Roles

  1. New Tables
    - `user_roles`
      - User role management
      - Admin and moderator roles
    
    - `forum_categories`
      - Forum organization structure
      - Category hierarchy
    
    - `forum_topics`
      - Discussion threads
      - Topic metadata
    
    - `forum_posts`
      - Individual forum posts/replies
      - Content and formatting
    
    - `forum_reactions`
      - Post reactions (likes, helpful, etc.)
      - User engagement tracking
    
    - `social_posts`
      - Platform-agnostic social media posts
      - Content and metadata
    
    - `social_interactions`
      - Engagement tracking
      - Platform-specific data
    
  2. Security
    - Enable RLS on all tables
    - Role-based access control
    - Community moderation capabilities
*/

-- User Roles table for access control
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Forum Categories
CREATE TABLE forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES forum_categories(id),
  icon text,
  color text,
  position integer DEFAULT 0,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forum Topics
CREATE TABLE forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES forum_categories(id),
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Forum Posts (Replies)
CREATE TABLE forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES forum_topics(id),
  author_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  parent_id uuid REFERENCES forum_posts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  edited_at timestamptz,
  edited_by uuid REFERENCES auth.users(id)
);

-- Forum Reactions
CREATE TABLE forum_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES forum_posts(id),
  user_id uuid REFERENCES auth.users(id),
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Social Media Posts
CREATE TABLE social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id),
  platform text NOT NULL,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  scheduled_for timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  tags text[] DEFAULT '{}',
  location jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social Media Interactions
CREATE TABLE social_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_posts(id),
  type text NOT NULL,
  platform_user_id text,
  platform_username text,
  content text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Allow users to view roles"
  ON user_roles FOR SELECT TO authenticated
  USING (true);

-- Forum Policies
CREATE POLICY "Allow users to view public categories"
  ON forum_categories FOR SELECT TO authenticated
  USING (
    NOT is_private OR 
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Allow users to create topics in public categories"
  ON forum_topics FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM forum_categories
      WHERE id = category_id AND (
        NOT is_private OR
        auth.uid() IN (
          SELECT user_id FROM user_roles 
          WHERE role IN ('admin', 'moderator')
        )
      )
    )
  );

CREATE POLICY "Allow users to view topics"
  ON forum_topics FOR SELECT TO authenticated
  USING (
    status = 'published' OR
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Allow users to create posts"
  ON forum_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM forum_topics
      WHERE id = topic_id AND NOT is_locked
    )
  );

CREATE POLICY "Allow users to view posts"
  ON forum_posts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own posts"
  ON forum_posts FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  );

-- Social Posts Policies
CREATE POLICY "Allow authenticated users to create social posts"
  ON social_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to view published social posts"
  ON social_posts FOR SELECT TO authenticated
  USING (
    status = 'published' OR 
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Allow users to update their own social posts"
  ON social_posts FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'moderator')
    )
  );

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_forum_categories_slug ON forum_categories(slug);
CREATE INDEX idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_slug ON forum_topics(slug);
CREATE INDEX idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX idx_forum_reactions_post ON forum_reactions(post_id);
CREATE INDEX idx_social_posts_author ON social_posts(author_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for);
CREATE INDEX idx_social_interactions_post ON social_interactions(post_id);

-- Functions
CREATE OR REPLACE FUNCTION update_topic_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_topics
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_last_activity_trigger
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_topic_last_activity();