import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { format, addDays } from 'date-fns';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
const ContentPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  content_type: z.enum(['blog', 'social', 'email', 'description']),
  target_audience: z.array(z.string()),
  channels: z.array(z.string()),
  scheduled_date: z.string(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  campaign_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const CampaignSchema = z.object({
  name: z.string(),
  description: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  objectives: z.array(z.string()),
  target_metrics: z.record(z.number()),
  budget: z.number().optional(),
  status: z.enum(['planning', 'active', 'completed', 'archived'])
});

export type ContentPlan = z.infer<typeof ContentPlanSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;

interface CampaignAnalytics {
  metrics: {
    total_views: number;
    avg_engagement: number[];
    total_conversions: number;
    total_revenue: number;
  };
  target_achievement: Array<{
    metric: string;
    target: number;
    actual: number;
    achievement: number;
  }>;
  campaign?: Campaign;
}

// Content Calendar Management
export const createContentPlan = async (plan: ContentPlan) => {
  try {
    const validatedPlan = ContentPlanSchema.parse(plan);
    
    const { data, error } = await supabase
      .from('content_plans')
      .insert(validatedPlan)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating content plan:', error);
    throw error;
  }
};

export const getContentCalendar = async (
  startDate: string,
  endDate: string,
  filters?: {
    contentType?: string[];
    status?: string[];
    campaignId?: string;
  }
) => {
  try {
    let query = supabase
      .from('content_plans')
      .select(`
        *,
        campaigns (
          name,
          status
        )
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate);

    if (filters?.contentType) {
      query = query.in('content_type', filters.contentType);
    }
    if (filters?.status) {
      query = query.in('status', filters.status);
    }
    if (filters?.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching content calendar:', error);
    throw error;
  }
};

// Campaign Management
export const createCampaign = async (campaign: Campaign) => {
  try {
    const validatedCampaign = CampaignSchema.parse(campaign);
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert(validatedCampaign)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const getCampaignAnalytics = async (campaignId: string): Promise<CampaignAnalytics> => {
  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get content performance
    const { data: contentPlans, error: contentError } = await supabase
      .from('content_plans')
      .select(`
        *,
        content_analytics (
          views,
          engagement_rate,
          conversion_rate,
          revenue
        )
      `)
      .eq('campaign_id', campaignId);

    if (contentError) throw contentError;

    // Calculate campaign metrics
    const metrics = contentPlans.reduce((acc: any, plan: any) => {
      const analytics = plan.content_analytics || {};
      return {
        total_views: (acc.total_views || 0) + (analytics.views || 0),
        avg_engagement: [...(acc.avg_engagement || []), analytics.engagement_rate || 0],
        total_conversions: (acc.total_conversions || 0) + (analytics.conversion_rate || 0),
        total_revenue: (acc.total_revenue || 0) + (analytics.revenue || 0)
      };
    }, {});

    // Calculate averages
    metrics.avg_engagement = metrics.avg_engagement.length > 0
      ? metrics.avg_engagement.reduce((a: number, b: number) => a + b) / metrics.avg_engagement.length
      : 0;

    // Compare with targets
    const performance = {
      metrics,
      target_achievement: Object.entries(campaign.target_metrics).map(([key, target]) => ({
        metric: key,
        target: target as number,
        actual: metrics[key] || 0,
        achievement: ((metrics[key] || 0) / (target as number)) * 100
      })),
      campaign
    };

    return performance;
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    throw error;
  }
};

// Content Performance Tracking
export const trackContentPerformance = async (
  contentId: string,
  metrics: {
    views?: number;
    engagement_rate?: number;
    conversion_rate?: number;
    revenue?: number;
    feedback?: string[];
  }
) => {
  try {
    const { data, error } = await supabase
      .from('content_analytics')
      .upsert({
        content_id: contentId,
        ...metrics,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking content performance:', error);
    throw error;
  }
};

// Content Calendar Automation
export const autoScheduleContent = async (
  campaignId: string,
  contentCount: number,
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    preferred_times?: string[];
    excluded_dates?: string[];
  }
) => {
  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    const schedule = [];
    let currentDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    while (schedule.length < contentCount && currentDate <= endDate) {
      // Skip excluded dates
      if (!preferences.excluded_dates?.includes(format(currentDate, 'yyyy-MM-dd'))) {
        // Add preferred posting time
        const timeIndex: number = schedule.length % (preferences.preferred_times?.length || 1);
        const defaultTime = '10:00';
        const time: string = preferences.preferred_times?.[timeIndex] || defaultTime;
        
        schedule.push({
          scheduled_date: `${format(currentDate, 'yyyy-MM-dd')}T${time}`,
          status: 'scheduled',
          campaign_id: campaignId
        });
      }

      // Advance to next date based on frequency
      switch (preferences.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'monthly':
          currentDate = addDays(currentDate, 30);
          break;
      }
    }

    return schedule;
  } catch (error) {
    console.error('Error auto-scheduling content:', error);
    throw error;
  }
};