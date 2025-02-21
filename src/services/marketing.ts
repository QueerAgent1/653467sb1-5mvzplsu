import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
export const BrandBookSchema = z.object({
  brand_name: z.string(),
  tagline: z.string(),
  mission: z.string(),
  vision: z.string(),
  values: z.array(z.string()),
  tone_of_voice: z.object({
    personality: z.array(z.string()),
    style_guide: z.string(),
    examples: z.array(z.string())
  }),
  visual_identity: z.object({
    color_palette: z.array(z.object({
      name: z.string(),
      hex: z.string(),
      usage: z.string()
    })),
    typography: z.object({
      primary_font: z.string(),
      secondary_font: z.string(),
      usage_guidelines: z.string()
    }),
    logo_usage: z.object({
      primary: z.string(),
      variations: z.array(z.string()),
      clear_space: z.string(),
      minimum_size: z.string()
    })
  }),
  target_audience: z.array(z.object({
    persona: z.string(),
    demographics: z.record(z.string()),
    psychographics: z.array(z.string()),
    pain_points: z.array(z.string()),
    aspirations: z.array(z.string())
  })),
  brand_messaging: z.object({
    key_messages: z.array(z.string()),
    value_proposition: z.string(),
    elevator_pitch: z.string()
  }),
  communication_channels: z.array(z.object({
    channel: z.string(),
    purpose: z.string(),
    tone: z.string(),
    content_types: z.array(z.string())
  }))
});

export const MarketingStrategySchema = z.object({
  name: z.string(),
  objectives: z.array(z.string()),
  target_metrics: z.record(z.number()),
  channels: z.array(z.string()),
  timeline: z.object({
    start_date: z.string(),
    end_date: z.string(),
    milestones: z.array(z.object({
      date: z.string(),
      description: z.string()
    }))
  }),
  budget: z.object({
    total: z.number(),
    allocation: z.record(z.number())
  }),
  campaigns: z.array(z.string())
});

export type BrandBook = z.infer<typeof BrandBookSchema>;
export type MarketingStrategy = z.infer<typeof MarketingStrategySchema>;

interface CampaignMetrics {
  reach: number;
  engagement: number;
  conversions: number;
  revenue: number;
}

interface ChannelPerformance {
  [key: string]: CampaignMetrics;
}

interface CampaignPerformance {
  name: string;
  metrics: CampaignMetrics;
}

interface MarketingPerformance {
  total_reach: number;
  total_engagement: number;
  total_conversions: number;
  total_revenue: number;
  channel_performance: ChannelPerformance;
  campaign_performance: CampaignPerformance[];
}

// Brand Book Management
export const createBrandBook = async (brandBook: BrandBook) => {
  try {
    const validatedBrandBook = BrandBookSchema.parse(brandBook);
    
    const { data, error } = await supabase
      .from('brand_books')
      .insert(validatedBrandBook)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating brand book:', error);
    throw error;
  }
};

export const getBrandBook = async () => {
  try {
    const { data, error } = await supabase
      .from('brand_books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brand book:', error);
    throw error;
  }
};

// Marketing Strategy Management
export const createMarketingStrategy = async (strategy: MarketingStrategy) => {
  try {
    const validatedStrategy = MarketingStrategySchema.parse(strategy);
    
    const { data, error } = await supabase
      .from('marketing_strategies')
      .insert(validatedStrategy)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating marketing strategy:', error);
    throw error;
  }
};

export const getMarketingPerformance = async (strategyId: string): Promise<MarketingPerformance> => {
  try {
    const { data: strategy } = await supabase
      .from('marketing_strategies')
      .select(`
        *,
        campaigns (
          id,
          name,
          status,
          content_plans (
            content_analytics (
              views,
              engagement_rate,
              conversion_rate,
              revenue
            )
          )
        )
      `)
      .eq('id', strategyId)
      .single();

    const performance: MarketingPerformance = {
      total_reach: 0,
      total_engagement: 0,
      total_conversions: 0,
      total_revenue: 0,
      channel_performance: {},
      campaign_performance: []
    };

    strategy.campaigns.forEach((campaign: any) => {
      const campaignMetrics: CampaignMetrics = {
        reach: 0,
        engagement: 0,
        conversions: 0,
        revenue: 0
      };

      campaign.content_plans.forEach((plan: any) => {
        const analytics = plan.content_analytics;
        if (analytics) {
          campaignMetrics.reach += analytics.views || 0;
          campaignMetrics.engagement += analytics.engagement_rate || 0;
          campaignMetrics.conversions += analytics.conversion_rate || 0;
          campaignMetrics.revenue += analytics.revenue || 0;

          plan.channels.forEach((channel: string) => {
            if (!performance.channel_performance[channel]) {
              performance.channel_performance[channel] = {
                reach: 0,
                engagement: 0,
                conversions: 0,
                revenue: 0
              };
            }
            performance.channel_performance[channel].reach += analytics.views || 0;
            performance.channel_performance[channel].engagement += analytics.engagement_rate || 0;
            performance.channel_performance[channel].conversions += analytics.conversion_rate || 0;
            performance.channel_performance[channel].revenue += analytics.revenue || 0;
          });
        }
      });

      performance.campaign_performance.push({
        name: campaign.name,
        metrics: campaignMetrics
      });

      performance.total_reach += campaignMetrics.reach;
      performance.total_engagement += campaignMetrics.engagement;
      performance.total_conversions += campaignMetrics.conversions;
      performance.total_revenue += campaignMetrics.revenue;
    });

    return performance;
  } catch (error) {
    console.error('Error fetching marketing performance:', error);
    throw error;
  }
};

// Marketing Recommendations
export const getMarketingRecommendations = async (strategyId: string) => {
  try {
    const performance = await getMarketingPerformance(strategyId);
    
    const recommendations = {
      strategy: [] as string[],
      channels: [] as string[],
      content: [] as string[],
      budget: [] as string[]
    };

    Object.entries(performance.channel_performance).forEach(([channel, metrics]) => {
      const roi = metrics.revenue / (metrics.reach || 1);
      if (roi < 2) {
        recommendations.channels.push(
          `Review ${channel} strategy - current ROI below target`
        );
      }
    });

    performance.campaign_performance.forEach((campaign) => {
      if (campaign.metrics.engagement < 0.1) {
        recommendations.content.push(
          `Improve content engagement for "${campaign.name}" campaign`
        );
      }
    });

    if (performance.total_revenue > 0) {
      const overallRoi = performance.total_revenue / performance.total_reach;
      if (overallRoi < 3) {
        recommendations.budget.push(
          'Consider reallocating budget to higher-performing channels'
        );
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating marketing recommendations:', error);
    throw error;
  }
};

// Brand Voice Analysis
export const analyzeBrandVoice = async (content: string) => {
  try {
    const brandBook = await getBrandBook();
    
    const analysis = {
      tone_match: 0,
      value_alignment: 0,
      message_consistency: 0,
      improvement_suggestions: [] as string[]
    };

    brandBook.tone_of_voice.personality.forEach((trait: string) => {
      const traitPresence = content.toLowerCase().includes(trait.toLowerCase());
      analysis.tone_match += traitPresence ? 1 : 0;
    });
    analysis.tone_match /= brandBook.tone_of_voice.personality.length;

    brandBook.values.forEach((value: string) => {
      const valuePresence = content.toLowerCase().includes(value.toLowerCase());
      analysis.value_alignment += valuePresence ? 1 : 0;
    });
    analysis.value_alignment /= brandBook.values.length;

    brandBook.brand_messaging.key_messages.forEach((message: string) => {
      const messagePresence = content.toLowerCase().includes(message.toLowerCase());
      analysis.message_consistency += messagePresence ? 1 : 0;
    });
    analysis.message_consistency /= brandBook.brand_messaging.key_messages.length;

    if (analysis.tone_match < 0.7) {
      analysis.improvement_suggestions.push(
        'Adjust tone to better match brand personality'
      );
    }
    if (analysis.value_alignment < 0.7) {
      analysis.improvement_suggestions.push(
        'Incorporate more brand values into the content'
      );
    }
    if (analysis.message_consistency < 0.7) {
      analysis.improvement_suggestions.push(
        'Ensure key brand messages are consistently communicated'
      );
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing brand voice:', error);
    throw error;
  }
};