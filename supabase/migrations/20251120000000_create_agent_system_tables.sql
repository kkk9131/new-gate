-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- 1. LLM Providers (API Keys & Config)
create table if not exists llm_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 'OpenAI', 'Gemini', 'Anthropic'
  base_url text, -- Optional override
  api_key text, -- Stored as plain text for MVP (should be encrypted in prod)
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Agent Profiles (Worker Definitions)
create table if not exists agent_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 'Router', 'Coder', 'Writer'
  description text,
  role text not null check (role in ('router', 'worker', 'supervisor')),
  provider_id uuid references llm_providers(id) on delete set null,
  model_name text not null, -- e.g. 'gpt-4-turbo', 'gemini-pro'
  system_prompt text,
  parameters jsonb default '{}'::jsonb, -- temperature, top_p, etc.
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Agent Routing Rules (For Router Agent)
create table if not exists agent_routing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  condition_pattern text not null, -- Regex or keyword to match user input
  target_agent_id uuid references agent_profiles(id) on delete cascade,
  priority integer default 0, -- Higher priority matches first
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Agent Memories (Vector Store)
create table if not exists agent_memories (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agent_profiles(id) on delete cascade, -- Optional: memory specific to an agent
  content text not null,
  embedding vector(1536), -- Standard size for OpenAI text-embedding-3-small
  metadata jsonb default '{}'::jsonb, -- Source, timestamp, context, etc.
  created_at timestamptz default now()
);

-- Add indexes
create index if not exists idx_agent_routing_rules_priority on agent_routing_rules(priority desc);
create index if not exists idx_agent_memories_embedding on agent_memories using hnsw (embedding vector_cosine_ops);

-- Enable RLS
alter table llm_providers enable row level security;
alter table agent_profiles enable row level security;
alter table agent_routing_rules enable row level security;
alter table agent_memories enable row level security;

-- RLS Policies (Simple policies for MVP: Authenticated users can read/write)
-- In a real multi-tenant app, this should be restricted to admin or specific users

-- llm_providers
create policy "Allow authenticated users to read providers"
  on llm_providers for select
  to authenticated
  using (true);

create policy "Allow authenticated users to manage providers"
  on llm_providers for all
  to authenticated
  using (true)
  with check (true);

-- agent_profiles
create policy "Allow authenticated users to read profiles"
  on agent_profiles for select
  to authenticated
  using (true);

create policy "Allow authenticated users to manage profiles"
  on agent_profiles for all
  to authenticated
  using (true)
  with check (true);

-- agent_routing_rules
create policy "Allow authenticated users to read rules"
  on agent_routing_rules for select
  to authenticated
  using (true);

create policy "Allow authenticated users to manage rules"
  on agent_routing_rules for all
  to authenticated
  using (true)
  with check (true);

-- agent_memories
create policy "Allow authenticated users to read memories"
  on agent_memories for select
  to authenticated
  using (true);

create policy "Allow authenticated users to insert memories"
  on agent_memories for insert
  to authenticated
  with check (true);

-- Updated_at triggers
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at_llm_providers
  before update on llm_providers
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_agent_profiles
  before update on agent_profiles
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_agent_routing_rules
  before update on agent_routing_rules
  for each row execute procedure moddatetime(updated_at);
