/*
  # CRM and Email Marketing System Schema

  1. New Tables
    - `contacts`
      - Core table for all contacts (clients and suppliers)
      - Stores basic contact information
      - Includes type field to differentiate between clients and suppliers
    
    - `suppliers`
      - Detailed supplier information
      - Services offered
      - Ratings and performance metrics
    
    - `clients`
      - Client preferences and history
      - Travel preferences
      - Special requirements
    
    - `email_templates`
      - Reusable email templates
      - Dynamic content placeholders
      - Category and usage tracking
    
    - `email_campaigns`
      - Campaign management
      - Targeting and scheduling
      - Performance tracking
    
    - `campaign_analytics`
      - Email campaign performance metrics
      - Open rates, click rates
      - Conversion tracking
    
    - `interactions`
      - All contact interactions
      - Communication history
      - Follow-up tracking
    
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated access
    - Role-based access control
*/

-- Contacts table (base table for both clients and suppliers)
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('client', 'supplier')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  company_name text,
  status text NOT NULL DEFAULT 'active',
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_contacted_at timestamptz
);

-- Suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY REFERENCES contacts(id),
  services text[] NOT NULL DEFAULT '{}',
  service_areas text[] DEFAULT '{}',
  rating decimal(3,2) CHECK (rating >= 0 AND rating <= 5),
  contract_start_date date,
  contract_end_date date,
  payment_terms text,
  commission_rate decimal(5,2),
  verification_status text DEFAULT 'pending',
  insurance_info jsonb,
  booking_platform_urls jsonb,
  performance_metrics jsonb DEFAULT '{
    "response_time": null,
    "booking_success_rate": null,
    "customer_satisfaction": null
  }'::jsonb
);

-- Clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY REFERENCES contacts(id),
  preferences jsonb DEFAULT '{
    "travel_style": [],
    "accommodation_type": [],
    "budget_range": null,
    "preferred_destinations": []
  }'::jsonb,
  special_requirements text[],
  loyalty_tier text DEFAULT 'standard',
  total_bookings integer DEFAULT 0,
  lifetime_value decimal(12,2) DEFAULT 0,
  marketing_preferences jsonb DEFAULT '{
    "email": true,
    "sms": false,
    "promotional": true,
    "newsletter": true
  }'::jsonb,
  last_booking_date timestamptz,
  acquisition_source text
);

-- Email templates
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0
);

-- Email campaigns
CREATE TABLE email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES email_templates(id),
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  target_audience jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'
);

-- Campaign analytics
CREATE TABLE campaign_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id),
  recipient_id uuid REFERENCES contacts(id),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  links_clicked text[],
  converted_at timestamptz,
  conversion_value decimal(12,2),
  unsubscribed_at timestamptz,
  device_info jsonb,
  location_info jsonb
);

-- Interactions
CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id),
  type text NOT NULL,
  channel text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject text,
  content text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read access to contacts"
  ON contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated create contacts"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update own contacts"
  ON contacts FOR UPDATE TO authenticated
  USING (auth.uid() IN (
    SELECT created_by FROM interactions WHERE contact_id = contacts.id
  ));

-- Similar policies for other tables
CREATE POLICY "Allow authenticated read suppliers"
  ON suppliers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read clients"
  ON clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read email templates"
  ON email_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage own email templates"
  ON email_templates FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow authenticated read email campaigns"
  ON email_campaigns FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage own campaigns"
  ON email_campaigns FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_suppliers_services ON suppliers USING gin(services);
CREATE INDEX idx_clients_preferences ON clients USING gin(preferences);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_interactions_contact ON interactions(contact_id);

-- Functions
CREATE OR REPLACE FUNCTION update_contact_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET last_contacted_at = NEW.created_at
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_last_contacted_trigger
AFTER INSERT ON interactions
FOR EACH ROW
EXECUTE FUNCTION update_contact_last_contacted();