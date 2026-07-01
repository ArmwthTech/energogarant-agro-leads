create table if not exists companies (
  id text primary key,
  name text not null,
  short_name text not null,
  inn text not null unique,
  ogrn text not null,
  district text not null,
  locality text not null,
  address text not null,
  okved text not null,
  lead_status text not null default 'new',
  revenue_rub bigint not null default 0,
  assets_rub bigint not null default 0,
  employees integer not null default 0,
  corporate_email text not null default '',
  phone text not null default '',
  website text not null default '',
  director text not null default '',
  source text not null,
  source_url text not null,
  confidence integer not null default 0,
  last_updated date not null default current_date,
  has_crop_okved boolean not null default false,
  has_machinery_signal boolean not null default false,
  has_corporate_contact boolean not null default false,
  risk_flags integer not null default 0,
  agent_comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  contact_type text not null,
  value text not null,
  is_personal boolean not null default false,
  verified_status text not null default 'requires_check',
  source_url text not null default '',
  fetched_at timestamptz not null default now()
);

create table if not exists source_facts (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  fact_type text not null,
  fact_value text not null,
  source_type text not null,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  verified_status text not null default 'unverified',
  confidence_score integer not null default 0
);

create table if not exists lead_activities (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  user_id text not null,
  action text not null,
  result text not null default '',
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists export_logs (
  id text primary key,
  user_id text not null,
  filter_json jsonb not null default '{}'::jsonb,
  columns_json jsonb not null default '[]'::jsonb,
  row_count integer not null,
  created_at timestamptz not null default now()
);

create table if not exists import_jobs (
  id text primary key,
  source_type text not null,
  cursor_value text not null default '',
  status text not null default 'queued',
  error text not null default '',
  imported_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  clerk_user_id text primary key,
  email text not null,
  role text not null default 'agent',
  created_at timestamptz not null default now()
);

create index if not exists companies_district_idx on companies(district);
create index if not exists companies_status_idx on companies(lead_status);
create index if not exists source_facts_company_idx on source_facts(company_id);
