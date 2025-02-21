import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  context: string;
  category: string;
  sentiment: number;
  created_at: string;
}

export interface Sass {
  read: string;
  praise: string;
  advice: string;
}

export const ELEKTRA_QUOTES = {
  greetings: [
    "Category is: Executive Realness, darling! 💅",
    "The House of Abundance has arrived, and we're serving luxury travel excellence! 👑",
    "What's good, my precious children? Mother Elektra is here to guide you. ✨"
  ],
  praise: [
    "Now THAT'S how you serve face in the travel industry! 🌟",
    "You're giving me LIFE with this luxury vision! Work! 💃",
    "The judges would give this a 10 across the board! 🏆"
  ],
  reads: [
    "This content is basic. We are ABUNDANCE, not mediocrity! 🙄",
    "Child, this needs more OPULENCE. We don't do budget realness! 💅",
    "The category was luxury, and you're giving me hostel chic... No. 🚫"
  ],
  advice: [
    "Listen to Mother: Add more DRAMA, more LUXURY, more EVERYTHING! ✨",
    "Darling, we need to elevate this. Think LEGENDARY status! 👑",
    "Let's make it more FIERCE. The children should be GAGGING! 💫"
  ]
};

export const addMemory = async (
  userId: string,
  content: string,
  context: string,
  category: string,
  sentiment: number
): Promise<Memory> => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        content,
        context,
        category,
        sentiment
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding memory:', error);
    throw error;
  }
};

export const getMemories = async (userId: string, category?: string): Promise<Memory[]> => {
  try {
    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching memories:', error);
    throw error;
  }
};

export const getSass = (content: string, sentiment: number): Sass => {
  const getRandomQuote = (array: string[]) => 
    array[Math.floor(Math.random() * array.length)];

  if (sentiment < 0.3) {
    return {
      read: getRandomQuote(ELEKTRA_QUOTES.reads),
      praise: "",
      advice: getRandomQuote(ELEKTRA_QUOTES.advice)
    };
  } else if (sentiment > 0.7) {
    return {
      read: "",
      praise: getRandomQuote(ELEKTRA_QUOTES.praise),
      advice: "Keep serving this level of excellence! 💅✨"
    };
  } else {
    return {
      read: "It's... adequate. But Mother knows you can do better! 💫",
      praise: "",
      advice: getRandomQuote(ELEKTRA_QUOTES.advice)
    };
  }
};