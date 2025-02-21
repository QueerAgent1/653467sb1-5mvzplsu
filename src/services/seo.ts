import { createClient } from '@supabase/supabase-js';
import keyword_extractor from 'keyword-extractor';
import natural from 'natural';

const TfIdf = natural.TfIdf;
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SEOAnalysis {
  keywords: {
    keyword: string;
    density: number;
    count: number;
    importance: number;
  }[];
  readability: {
    score: number;
    level: string;
    suggestions: string[];
  };
  contentStructure: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    headingCount: number;
    suggestions: string[];
  };
  competitorAnalysis: {
    topKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
  };
}

export const extractKeywords = (text: string) => {
  const tfidf = new TfIdf();
  tfidf.addDocument(text);
  
  const extraction = keyword_extractor.extract(text, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
  });
  
  const keywords = extraction.map(keyword => {
    const count = (text.match(new RegExp(keyword, 'gi')) || []).length;
    const density = count / text.split(/\s+/).length * 100;
    const importance = tfidf.tfidf(keyword, 0);
    
    return {
      keyword,
      density,
      count,
      importance
    };
  });
  
  return keywords.sort((a, b) => b.importance - a.importance).slice(0, 10);
};

const calculateReadabilityScore = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = text.split(/[aeiou]+/i).length - 1;
  
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
};

const getReadabilityLevel = (score: number): string => {
  if (score <= 6) return 'Very Easy';
  if (score <= 8) return 'Easy';
  if (score <= 10) return 'Fairly Easy';
  if (score <= 12) return 'Standard';
  if (score <= 14) return 'Fairly Difficult';
  if (score <= 16) return 'Difficult';
  return 'Very Difficult';
};

const getReadabilitySuggestions = (score: number, contentStructure: any): string[] => {
  const suggestions: string[] = [];
  
  if (score > 12) {
    suggestions.push('Consider simplifying your language for better readability');
    suggestions.push('Break down complex sentences into shorter ones');
  }
  
  if (contentStructure.wordCount < 300) {
    suggestions.push('Consider adding more content to improve depth');
  }
  
  if (contentStructure.paragraphCount < 3) {
    suggestions.push('Break content into more paragraphs for better readability');
  }
  
  return suggestions;
};

const analyzeContentStructure = (text: string) => {
  const wordCount = text.trim().split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;
  const paragraphCount = text.split(/\n\s*\n/).length;
  const headingCount = (text.match(/#{1,6}\s/g) || []).length;
  
  const suggestions: string[] = [];
  
  if (wordCount < 300) suggestions.push('Add more content to improve depth');
  if (paragraphCount < 3) suggestions.push('Break content into more paragraphs');
  if (headingCount < 2) suggestions.push('Add more headings for better structure');
  
  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    headingCount,
    suggestions
  };
};

export const analyzeSEO = async (content: string): Promise<SEOAnalysis> => {
  try {
    const keywords = extractKeywords(content);
    const contentStructure = analyzeContentStructure(content);
    const readabilityScore = calculateReadabilityScore(content);
    
    const readability = {
      score: readabilityScore,
      level: getReadabilityLevel(readabilityScore),
      suggestions: getReadabilitySuggestions(readabilityScore, contentStructure)
    };
    
    const competitorAnalysis = {
      topKeywords: keywords.slice(0, 5).map(k => k.keyword),
      missingKeywords: ['luxury travel', 'LGBTQ friendly', 'exclusive destinations'].filter(
        k => !keywords.some(kw => kw.keyword.includes(k))
      ),
      recommendations: [
        'Include more location-specific keywords',
        'Add more luxury travel related terms',
        'Incorporate LGBTQ+ friendly destination highlights'
      ]
    };
    
    return {
      keywords,
      readability,
      contentStructure,
      competitorAnalysis
    };
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    throw new Error('Failed to analyze content for SEO');
  }
};

export const getSEOSuggestions = async (analysis: SEOAnalysis): Promise<string[]> => {
  const suggestions: string[] = [];
  
  const lowDensityKeywords = analysis.keywords.filter(k => k.density < 0.5);
  if (lowDensityKeywords.length > 0) {
    suggestions.push(`Consider increasing usage of keywords: ${lowDensityKeywords.map(k => k.keyword).join(', ')}`);
  }
  
  suggestions.push(...analysis.readability.suggestions);
  suggestions.push(...analysis.contentStructure.suggestions);
  
  if (analysis.competitorAnalysis.missingKeywords.length > 0) {
    suggestions.push(`Consider adding these keywords: ${analysis.competitorAnalysis.missingKeywords.join(', ')}`);
  }
  
  return suggestions;
};