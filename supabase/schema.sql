-- ABSOLUTE MOTION — esquema do banco (Postgres / Supabase)
-- Rode no SQL editor do Supabase.

create extension if not exists "pgcrypto";

-- Usuários (espelho do auth.users, com créditos e plano)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free',           -- free | starter | pro
  credits int not null default 30,             -- 1 crédito ~= 1 segundo de vídeo
  created_at timestamptz not null default now()
);

-- Pastas (organização de projetos)
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Membros do time (colaboração)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles(id) on delete cascade,
  email text not null,
  role text not null default 'editor',          -- owner | editor | viewer
  created_at timestamptz not null default now()
);

-- Projetos = um anúncio
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null default 'Novo anúncio',
  product text,
  brief jsonb not null default '{}'::jsonb,     -- produto, público, estilo, formato, duração, idioma, voz, modelo
  concept jsonb,                                -- titulo, bigIdea, gancho, cta
  status text not null default 'draft',         -- draft | ready
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cenas do storyboard
create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  idx int not null,
  duration_sec int not null default 5,
  keyframe_prompt text,
  motion_prompt text,
  narration text,
  caption text,
  keyframe_url text,                            -- imagem gerada (FLUX/Seedream)
  clip_url text,                                -- vídeo da cena (Seedance/Kling)
  status text not null default 'pending',       -- pending | keyframe | video | done | error
  unique (project_id, idx)
);

-- Jobs de render (fila)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'queued',        -- queued | running | composing | done | error
  step text,                                    -- mensagem do passo atual
  progress int not null default 0,              -- 0-100
  video_model text not null default 'seedance-2.0',
  image_model text not null default 'flux-dev',
  output_url text,                              -- vídeo final
  cost_usd numeric(10,4) default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assets (narração, trilha, etc.)
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null,                           -- narration | music | sfx | caption_track
  url text,
  meta jsonb default '{}'::jsonb
);

create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_scenes_project on scenes(project_id);

-- RLS: cada usuário só vê o que é seu
alter table projects enable row level security;
alter table scenes enable row level security;
alter table jobs enable row level security;
alter table assets enable row level security;

create policy "own_projects" on projects for all using (auth.uid() = user_id);
create policy "own_jobs" on jobs for all using (auth.uid() = user_id);
create policy "own_scenes" on scenes for all
  using (exists (select 1 from projects p where p.id = scenes.project_id and p.user_id = auth.uid()));
create policy "own_assets" on assets for all
  using (exists (select 1 from projects p where p.id = assets.project_id and p.user_id = auth.uid()));

-- Lista de espera (fake door)
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamptz not null default now()
);
