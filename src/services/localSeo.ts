import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BusinessLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  category: string;
}

export interface CitationSource {
  name: string;
  domain: string;
  importance: number;
  listed: boolean;
  url?: string;
  status?: 'accurate' | 'inaccurate' | 'missing';
}

export interface LocalSEOAnalysis {
  businessInfo: {
    accuracy: number;
    completeness: number;
    suggestions: string[];
  };
  citations: {
    total: number;
    accurate: number;
    inaccurate: number;
    missing: number;
    sources: CitationSource[];
  };
  localRankingFactors: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  competitorAnalysis: {
    totalCompetitors: number;
    topCompetitors: string[];
    uniqueSellingPoints: string[];
    gaps: string[];
  };
}

const MAJOR_CITATION_SOURCES: CitationSource[] = [
  { name: 'Google Business Profile', domain: 'google.com', importance: 10, listed: false, status: 'missing' },
  { name: 'Bing Places', domain: 'bing.com', importance: 8, listed: false, status: 'missing' },
  { name: 'Apple Maps', domain: 'apple.com/maps', importance: 8, listed: false, status: 'missing' },
  { name: 'Yelp', domain: 'yelp.com', importance: 7, listed: false, status: 'missing' },
  { name: 'Facebook', domain: 'facebook.com', importance: 7, listed: false, status: 'missing' },
  { name: 'TripAdvisor', domain: 'tripadvisor.com', importance: 6, listed: false, status: 'missing' },
  { name: 'IGLTA', domain: 'iglta.org', importance: 9, listed: false, status: 'missing' },
  { name: 'Purple Roofs', domain: 'purpleroofs.com', importance: 8, listed: false, status: 'missing' },
  { name: 'Out Traveler', domain: 'outtraveler.com', importance: 7, listed: false, status: 'missing' }
];

const validateBusinessInfo = (business: BusinessLocation): [number, string[]] => {
  const suggestions: string[] = [];
  let completeness = 0;
  const totalFields = Object.keys(business).length;
  
  Object.entries(business).forEach(([field, value]) => {
    if (value && value.trim()) {
      completeness++;
    } else {
      suggestions.push(`Add missing ${field} information`);
    }
  });
  
  if (!business.phone.match(/^\+?1?\d{10}$/)) {
    suggestions.push('Format phone number as a 10-digit number');
  }
  
  if (!business.website.startsWith('https://')) {
    suggestions.push('Ensure website URL uses HTTPS');
  }
  
  if (business.category.length < 3) {
    suggestions.push('Add more specific business category');
  }
  
  return [(completeness / totalFields) * 100, suggestions];
};

const analyzeCitations = async (business: BusinessLocation): Promise<{
  sources: CitationSource[];
  stats: { total: number; accurate: number; inaccurate: number; missing: number; };
}> => {
  const sources = MAJOR_CITATION_SOURCES.map(source => ({
    ...source,
    listed: Math.random() > 0.5,
    status: Math.random() > 0.5 ? 'accurate' as const : Math.random() > 0.5 ? 'inaccurate' as const : 'missing' as const,
    url: Math.random() > 0.5 ? `https://${source.domain}/business` : undefined
  }));
  
  const stats = sources.reduce((acc, source) => ({
    total: acc.total + 1,
    accurate: acc.accurate + (source.status === 'accurate' ? 1 : 0),
    inaccurate: acc.inaccurate + (source.status === 'inaccurate' ? 1 : 0),
    missing: acc.missing + (source.status === 'missing' ? 1 : 0)
  }), { total: 0, accurate: 0, inaccurate: 0, missing: 0 });
  
  return { sources, stats };
};

const analyzeLocalRankingFactors = (
  business: BusinessLocation,
  citations: { sources: CitationSource[]; stats: any; }
): {
  score: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
} => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  let score = 0;
  
  if (citations.stats.accurate > citations.stats.total * 0.7) {
    score += 30;
    strengths.push('Strong citation presence across major platforms');
  } else {
    weaknesses.push('Inconsistent business information across citations');
    opportunities.push('Standardize business information across all platforms');
  }
  
  const lgbtqPlatforms = citations.sources.filter(s => 
    ['iglta.org', 'purpleroofs.com', 'outtraveler.com'].includes(s.domain)
  );
  
  if (lgbtqPlatforms.some(p => p.status === 'accurate')) {
    score += 20;
    strengths.push('Present on major LGBTQ+ travel platforms');
  } else {
    opportunities.push('Establish presence on LGBTQ+ specific travel platforms');
  }
  
  if (business.website.includes('https')) {
    score += 10;
    strengths.push('Secure website with HTTPS');
  } else {
    weaknesses.push('Website not secure (missing HTTPS)');
    opportunities.push('Upgrade website to use HTTPS');
  }
  
  const [completeness] = validateBusinessInfo(business);
  if (completeness > 90) {
    score += 20;
    strengths.push('Complete and accurate business information');
  } else {
    weaknesses.push('Incomplete business information');
    opportunities.push('Complete missing business information fields');
  }
  
  return {
    score,
    strengths,
    weaknesses,
    opportunities
  };
};

export const analyzeLocalSEO = async (business: BusinessLocation): Promise<LocalSEOAnalysis> => {
  try {
    const [completeness, suggestions] = validateBusinessInfo(business);
    const citationAnalysis = await analyzeCitations(business);
    const rankingFactors = analyzeLocalRankingFactors(business, citationAnalysis);
    
    const competitorAnalysis = {
      totalCompetitors: 15,
      topCompetitors: [
        'Luxury Rainbow Travel',
        'Pride Voyages',
        'Inclusive Journeys'
      ],
      uniqueSellingPoints: [
        'Exclusive LGBTQ+ luxury experiences',
        'Local cultural expertise',
        'Personalized travel planning'
      ],
      gaps: [
        'Limited social media presence',
        'Few customer reviews',
        'Missing from some major LGBTQ+ platforms'
      ]
    };
    
    return {
      businessInfo: {
        accuracy: completeness,
        completeness,
        suggestions
      },
      citations: {
        ...citationAnalysis.stats,
        sources: citationAnalysis.sources
      },
      localRankingFactors: rankingFactors,
      competitorAnalysis
    };
  } catch (error) {
    console.error('Error analyzing local SEO:', error);
    throw new Error('Failed to analyze local SEO');
  }
};