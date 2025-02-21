import { serve } from 'https://deno.fresh.dev/std@v1.0/http/server.ts';
import { MistralClient } from 'npm:@mistralai/mistralai';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { Anthropic } from 'npm:@anthropic-ai/sdk';
import { CohereClient } from 'npm:cohere-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

const checkRateLimit = (clientIp: string): boolean => {
  const now = Date.now();
  const clientData = requestCounts.get(clientIp);

  if (!clientData || (now - clientData.timestamp) > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientIp, { count: 1, timestamp: now });
    return true;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  clientData.count++;
  return true;
};

// Queue implementation
const queue = new Map<string, Promise<any>>();
const MAX_CONCURRENT_REQUESTS = 3;

const enqueueRequest = async (key: string, operation: () => Promise<any>) => {
  while (queue.size >= MAX_CONCURRENT_REQUESTS) {
    await Promise.race(queue.values());
  }

  const promise = operation().finally(() => queue.delete(key));
  queue.set(key, promise);
  return promise;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const { prompt, contentType, provider } = await req.json();

    const basePrompt = `Create ${contentType === 'blog' ? 'a' : ''} ${contentType} content for a luxury LGBTQ+ travel agency called QueerLuxe Travel based in San Diego. The content should be inclusive, welcoming, and focused on luxury travel experiences.`;
    const formattedPrompt = `${basePrompt}\n\nSpecific request: ${prompt}`;

    const requestKey = `${clientIp}-${Date.now()}`;
    
    const content = await enqueueRequest(requestKey, async () => {
      switch (provider) {
        case 'mistral': {
          const mistral = new MistralClient(Deno.env.get('MISTRAL_API_KEY') || '');
          const response = await mistral.chat({
            model: 'mistral-medium',
            messages: [{ role: 'user', content: formattedPrompt }],
          });
          return response.choices[0].message.content;
        }
        case 'gemini': {
          const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
          const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
          const response = await model.generateContent(formattedPrompt);
          const result = await response.response;
          return result.text();
        }
        case 'anthropic': {
          const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });
          const response = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: formattedPrompt }],
          });
          return response.content[0].text;
        }
        case 'cohere': {
          const cohere = new CohereClient({ token: Deno.env.get('COHERE_API_KEY') || '' });
          const response = await cohere.generate({
            prompt: formattedPrompt,
            model: 'command',
            maxTokens: 1000,
          });
          return response.generations[0].text;
        }
        default:
          throw new Error('Invalid AI provider selected');
      }
    });

    return new Response(
      JSON.stringify({ content }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});