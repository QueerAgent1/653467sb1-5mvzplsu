import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
const CategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.number().optional(),
  is_private: z.boolean().optional()
});

const TopicSchema = z.object({
  category_id: z.string(),
  title: z.string(),
  content: z.string(),
  is_pinned: z.boolean().optional(),
  is_locked: z.boolean().optional()
});

const PostSchema = z.object({
  topic_id: z.string(),
  content: z.string(),
  parent_id: z.string().optional()
});

export type ForumCategory = z.infer<typeof CategorySchema>;
export type ForumTopic = z.infer<typeof TopicSchema>;
export type ForumPost = z.infer<typeof PostSchema>;

// Category Management
export const createCategory = async (category: ForumCategory) => {
  try {
    const validatedCategory = CategorySchema.parse(category);
    
    const { data, error } = await supabase
      .from('forum_categories')
      .insert(validatedCategory)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const getCategories = async (includePrivate = false) => {
  try {
    let query = supabase
      .from('forum_categories')
      .select('*')
      .order('position');

    if (!includePrivate) {
      query = query.eq('is_private', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Topic Management
export const createTopic = async (topic: ForumTopic) => {
  try {
    const validatedTopic = TopicSchema.parse(topic);
    const slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data, error } = await supabase
      .from('forum_topics')
      .insert({ ...validatedTopic, slug })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating topic:', error);
    throw error;
  }
};

export const getTopics = async (categoryId: string, page = 1, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .select(`
        *,
        author:author_id(id, email),
        posts:forum_posts(count)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
};

// Post Management
export const createPost = async (post: ForumPost) => {
  try {
    const validatedPost = PostSchema.parse(post);
    
    const { data, error } = await supabase
      .from('forum_posts')
      .insert(validatedPost)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (topicId: string, page = 1, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        author:author_id(id, email),
        reactions:forum_reactions(reaction_type, count)
      `)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Reactions
export const addReaction = async (postId: string, reactionType: string) => {
  try {
    const { data, error } = await supabase
      .from('forum_reactions')
      .insert({
        post_id: postId,
        reaction_type: reactionType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

export const removeReaction = async (postId: string, reactionType: string) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('forum_reactions')
      .delete()
      .match({
        post_id: postId,
        reaction_type: reactionType,
        user_id: session.session.user.id
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};