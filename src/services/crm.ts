import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { z } from 'zod';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
const ContactSchema = z.object({
  type: z.enum(['client', 'supplier']),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  status: z.string().default('active'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

const SupplierSchema = z.object({
  services: z.array(z.string()),
  service_areas: z.array(z.string()),
  rating: z.number().min(0).max(5).optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  payment_terms: z.string().optional(),
  commission_rate: z.number().optional(),
  verification_status: z.string().default('pending'),
  insurance_info: z.record(z.unknown()).optional(),
  booking_platform_urls: z.record(z.string()).optional()
});

const ClientSchema = z.object({
  preferences: z.object({
    travel_style: z.array(z.string()),
    accommodation_type: z.array(z.string()),
    budget_range: z.string().optional(),
    preferred_destinations: z.array(z.string())
  }),
  special_requirements: z.array(z.string()),
  loyalty_tier: z.string().default('standard'),
  marketing_preferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    promotional: z.boolean().default(true),
    newsletter: z.boolean().default(true)
  })
});

export type Contact = z.infer<typeof ContactSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
export type Client = z.infer<typeof ClientSchema>;

// Contact Management
export const createContact = async (
  contactData: Contact,
  additionalData: Supplier | Client
) => {
  try {
    // Validate base contact data
    const validatedContact = ContactSchema.parse(contactData);
    
    // Start transaction
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert(validatedContact)
      .select()
      .single();

    if (contactError) throw contactError;

    // Add type-specific data
    if (contactData.type === 'supplier') {
      const validatedSupplier = SupplierSchema.parse(additionalData);
      const { error: supplierError } = await supabase
        .from('suppliers')
        .insert({ id: contact.id, ...validatedSupplier });

      if (supplierError) throw supplierError;
    } else {
      const validatedClient = ClientSchema.parse(additionalData);
      const { error: clientError } = await supabase
        .from('clients')
        .insert({ id: contact.id, ...validatedClient });

      if (clientError) throw clientError;
    }

    return contact;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

export const updateContact = async (
  id: string,
  contactData: Partial<Contact>,
  additionalData?: Partial<Supplier | Client>
) => {
  try {
    const { error: contactError } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id);

    if (contactError) throw contactError;

    if (additionalData) {
      const table = contactData.type === 'supplier' ? 'suppliers' : 'clients';
      const { error: typeError } = await supabase
        .from(table)
        .update(additionalData)
        .eq('id', id);

      if (typeError) throw typeError;
    }

    return true;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const getContact = async (id: string) => {
  try {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError) throw contactError;

    const table = contact.type === 'supplier' ? 'suppliers' : 'clients';
    const { data: details, error: detailsError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (detailsError) throw detailsError;

    return { ...contact, ...details };
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw error;
  }
};

// Email Campaign Management
export const createEmailCampaign = async (campaign: {
  name: string;
  template_id: string;
  target_audience: Record<string, unknown>;
  scheduled_at?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        ...campaign,
        status: campaign.scheduled_at ? 'scheduled' : 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating email campaign:', error);
    throw error;
  }
};

export const getEmailCampaignAnalytics = async (campaignId: string) => {
  try {
    const { data, error } = await supabase
      .from('campaign_analytics')
      .select(`
        *,
        contacts (
          first_name,
          last_name,
          email
        )
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const analytics = {
      total_recipients: data.length,
      opened: data.filter(d => d.opened_at).length,
      clicked: data.filter(d => d.clicked_at).length,
      converted: data.filter(d => d.converted_at).length,
      unsubscribed: data.filter(d => d.unsubscribed_at).length,
      details: data
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    throw error;
  }
};

// Interaction Management
export const createInteraction = async (interaction: {
  contact_id: string;
  type: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  scheduled_at?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        ...interaction,
        status: interaction.scheduled_at ? 'scheduled' : 'completed',
        completed_at: interaction.scheduled_at ? null : new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating interaction:', error);
    throw error;
  }
};

export const getContactInteractions = async (contactId: string) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching interactions:', error);
    throw error;
  }
};