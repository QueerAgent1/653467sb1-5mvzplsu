import { createClient } from '@supabase/supabase-js';

export type ContentType = 'blog' | 'social' | 'email' | 'description';
export type AIProvider = 'mistral' | 'gemini' | 'anthropic' | 'cohere';

export interface CrossCheckResult {
  provider: AIProvider;
  content: string;
  analysis: {
    tone: string;
    perspective: string;
    uniqueInsights: string[];
    strengths: string[];
    recommendedSections: string[];
  };
}

export interface CombinedContent {
  content: string;
  images: ImageSuggestion[];
  sourceAttribution: {
    provider: AIProvider;
    section: string;
  }[];
}

export interface ImageSuggestion {
  prompt: string;
  description: string;
  unsplashQuery: string;
  alternativeText: string;
}

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generatePromptHash = async (prompt: string, contentType: ContentType, provider: AIProvider): Promise<string> => {
  const data = `${prompt}-${contentType}-${provider}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getBestProvider = (contentType: ContentType): AIProvider => {
  switch (contentType) {
    case 'blog':
      return 'anthropic';
    case 'social':
      return 'gemini';
    case 'email':
      return 'cohere';
    case 'description':
      return 'mistral';
    default:
      return 'anthropic';
  }
};

export const generateContent = async (
  prompt: string,
  contentType: ContentType,
  provider: AIProvider
): Promise<string> => {
  try {
    const promptHash = await generatePromptHash(prompt, contentType, provider);
    const { data: cachedResponse } = await supabase
      .from('ai_responses')
      .select('response, usage_count')
      .eq('prompt_hash', promptHash)
      .single();

    if (cachedResponse) {
      await supabase
        .from('ai_responses')
        .update({ usage_count: (cachedResponse.usage_count || 0) + 1 })
        .eq('prompt_hash', promptHash);

      return cachedResponse.response;
    }

    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: {
        prompt,
        contentType,
        provider
      }
    });

    if (error) throw error;
    if (!data?.content) throw new Error('No content received from the AI provider');

    await supabase.from('ai_responses').insert({
      prompt_hash: promptHash,
      prompt,
      content_type: contentType,
      provider,
      response: data.content,
      usage_count: 1
    });

    return data.content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
};

export const crossCheckContent = async (
  prompt: string,
  contentType: ContentType,
  primaryContent: string
): Promise<CrossCheckResult[]> => {
  const providers: AIProvider[] = ['mistral', 'gemini', 'anthropic', 'cohere'];
  const results: CrossCheckResult[] = [];

  for (const provider of providers) {
    if (provider === getBestProvider(contentType)) continue;
    
    try {
      const content = await generateContent(prompt, contentType, provider);
      const { data: analysisData } = await supabase.functions.invoke('analyze-content', {
        body: {
          content,
          provider
        }
      });

      if (analysisData) {
        results.push({
          provider,
          content,
          analysis: analysisData
        });
      }
    } catch (error) {
      console.error(`Error cross-checking with ${provider}:`, error);
    }
  }

  return results;
};