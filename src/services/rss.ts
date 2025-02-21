import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { z } from 'zod';
import { extractKeywords } from './seo';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const parser = new Parser();

const RSSFeedSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  category: z.string(),
  update_frequency: z.number(),
  last_checked: z.string().optional(),
  is_active: z.boolean().default(true)
});

const TrendSchema = z.object({
  keyword: z.string(),
  category: z.string(),
  source_urls: z.array(z.string()),
  first_seen: z.string(),
  last_seen: z.string(),
  mention_count: z.number(),
  sentiment_score: z.number().optional(),
  related_keywords: z.array(z.string()).optional()
});

export type RSSFeed = z.infer<typeof RSSFeedSchema>;
export type Trend = z.infer<typeof TrendSchema>;

export const addRSSFeed = async (feed: RSSFeed) => {
  try {
    const validatedFeed = RSSFeedSchema.parse(feed);
    
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert(validatedFeed)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding RSS feed:', error);
    throw error;
  }
};

export const fetchAndProcessFeeds = async () => {
  try {
    const { data: feeds, error: feedError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (feedError) throw feedError;

    for (const feed of feeds) {
      try {
        const feedContent = await parser.parseURL(feed.url);
        
        for (const item of feedContent.items) {
          const content = `${item.title} ${item.contentSnippet}`;
          const keywords = await extractKeywords(content);
          
          if (!item.link) continue;

          await supabase
            .from('rss_articles')
            .insert({
              feed_id: feed.id,
              title: item.title,
              content: item.contentSnippet,
              url: item.link,
              published_at: item.pubDate,
              keywords: keywords.map(k => k.keyword)
            })
            .select()
            .single();

          await updateTrends(keywords, feed.category, item.link);
        }

        await supabase
          .from('rss_feeds')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', feed.id);

      } catch (feedProcessError) {
        console.error(`Error processing feed ${feed.url}:`, feedProcessError);
      }
    }
  } catch (error) {
    console.error('Error fetching and processing feeds:', error);
    throw error;
  }
};

const updateTrends = async (
  keywords: Array<{ keyword: string; importance: number }>,
  category: string,
  sourceUrl: string
) => {
  try {
    for (const { keyword } of keywords) {
      const { data: existingTrend, error: trendError } = await supabase
        .from('trends')
        .select('*')
        .eq('keyword', keyword)
        .eq('category', category)
        .single();

      if (trendError && trendError.code !== 'PGRST116') {
        throw trendError;
      }

      if (existingTrend) {
        await supabase
          .from('trends')
          .update({
            last_seen: new Date().toISOString(),
            mention_count: existingTrend.mention_count + 1,
            source_urls: Array.from(new Set([...existingTrend.source_urls, sourceUrl]))
          })
          .eq('id', existingTrend.id);
      } else {
        await supabase
          .from('trends')
          .insert({
            keyword,
            category,
            source_urls: [sourceUrl],
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            mention_count: 1
          });
      }
    }
  } catch (error) {
    console.error('Error updating trends:', error);
    throw error;
  }
};

export const getTrendingTopics = async (
  category?: string,
  timeframe: 'day' | 'week' | 'month' = 'week',
  limit = 10
) => {
  try {
    let query = supabase
      .from('trends')
      .select('*')
      .order('mention_count', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const timeAgo = new Date();
    switch (timeframe) {
      case 'day':
        timeAgo.setDate(timeAgo.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(timeAgo.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(timeAgo.getMonth() - 1);
        break;
    }

    query = query.gte('last_seen', timeAgo.toISOString());

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    throw error;
  }
};

export const getRelatedTrends = async (keyword: string, limit = 5) => {
  try {
    const { data: trend, error: trendError } = await supabase
      .from('trends')
      .select('*')
      .eq('keyword', keyword)
      .single();

    if (trendError) throw trendError;

    const { data: relatedTrends, error: relatedError } = await supabase
      .from('trends')
      .select('*')
      .neq('keyword', keyword)
      .eq('category', trend.category)
      .order('mention_count', { ascending: false })
      .limit(limit);

    if (relatedError) throw relatedError;
    return relatedTrends;
  } catch (error) {
    console.error('Error fetching related trends:', error);
    throw error;
  }
};