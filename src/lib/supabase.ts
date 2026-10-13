// Re-exporting unified Server-Switching and Resilient Offline Storage API
// This replaces direct hardcoded Supabase connectivity with multi-server and offline capabilities.
export { api, localStore } from './api';
export { ServerManager, DEFAULT_SERVERS } from './serverConfig';

// Backward compatibility helpers
export const isSupabaseConfigured = (): boolean => {
  return false; // Deprecated in favor of multi-server switcher and offline-first engine
};

export const getSupabase = () => null;

export const SUPABASE_SQL_SETUP = `-- Legacy SQL reference for self-hosted PostgreSQL / SaaS instances
create table if not exists customers (
  id text primary key,
  company_name text not null,
  contact_person text not null,
  email text,
  phone text,
  address text,
  city text,
  tax_number text,
  balance_due numeric default 0,
  equipment_fleet jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists invoices (
  id text primary key,
  invoice_number text unique not null,
  customer_id text references customers(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_address text,
  customer_tax_number text,
  service_category text not null,
  date date not null,
  due_date date not null,
  equipment_info text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null,
  tax_rate numeric default 0.15,
  tax_amount numeric default 0,
  discount_rate numeric default 0,
  discount_amount numeric default 0,
  total numeric not null,
  deposit_paid numeric default 0,
  balance_due numeric default 0,
  status text not null default 'pending',
  notes text,
  terms text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
`;
