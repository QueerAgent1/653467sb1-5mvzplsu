import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
const SocialPostSchema = z.object({
  platform: z.string(),
  content: z.string(),
  media_urls: z.array(z.string()).optional(),
  scheduled_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.record(z.unknown()).optional(),
  campaign_id: z.string().optional()
});

export type SocialPost = z.infer<typeof SocialPostSchema>;

export interface SocialInteraction {
  post_id: string;
  type: 'like' | 'share' | 'comment';
  platform_user_id?: string;
  platform_username?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

interface SocialAnalytics {
  likes: number;
  shares: number;
  comments: number;
  total_engagement: number;
}

// Social Media Management
export const createSocialPost = async (post: SocialPost) => {
  try {
    const validatedPost = SocialPostSchema.parse(post);
    
    const { data, error } = await supabase
      .from('social_posts')
      .insert(validatedPost)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating social post:', error);
    throw error;
  }
};

export const scheduleSocialPost = async (post: SocialPost) => {
  try {
    if (!post.scheduled_at) {
      throw new Error('Scheduled time is required');
    }

    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        ...post,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling social post:', error);
    throw error;
  }
};

export const getSocialPostAnalytics = async (postId: string): Promise<SocialAnalytics> => {
  try {
    const { data: interactions, error } = await supabase
      .from('social_interactions')
      .select('type, count')
      .eq('post_id', postId);

    if (error) throw error;

    const analytics: SocialAnalytics = {
      likes: 0,
      shares: 0,
      comments: 0,
      total_engagement: 0
    };

    interactions.forEach((interaction: { type: 'like' | 'share' | 'comment'; count: number }) => {
      analytics[interaction.type === 'like' ? 'likes' : interaction.type === 'share' ? 'shares' : 'comments'] = interaction.count;
      analytics.total_engagement += interaction.count;
    });

    return analytics;
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    throw error;
  }
};

export const trackSocialInteraction = async (interaction: SocialInteraction) => {
  try {
    const { data, error } = await supabase
      .from('social_interactions')
      .insert(interaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking social interaction:', error);
    throw error;
  }
};