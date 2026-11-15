-- Área administrativa de entrevistas com lojistas.
-- Aplique este arquivo no Supabase (SQL Editor) se o projeto não aplicar migrações automaticamente.

-- ============================================================
-- Papéis (tabela separada, nunca no perfil nem no client)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin');
  end if;
end
$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- Permite à tela de login saber se ainda não existe nenhum admin (para liberar o primeiro cadastro).
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where role = 'admin');
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_exists() to anon, authenticated;

drop policy if exists "Usuário lê o próprio papel" on public.user_roles;
create policy "Usuário lê o próprio papel"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

-- A PRIMEIRA conta criada vira admin. As seguintes nunca viram admin automaticamente.
create or replace function public.handle_first_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_first_admin on auth.users;
create trigger on_auth_user_created_first_admin
  after insert on auth.users
  for each row execute function public.handle_first_admin();

-- ============================================================
-- Entrevistas
-- ============================================================
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  status text not null default 'rascunho' check (status in ('rascunho', 'concluida')),

  store_name text not null default '',
  interviewee_name text not null default '',
  interviewee_role text not null default '',
  store_size text check (store_size in ('pequena', 'media', 'grande', 'ex_cliente')),
  city text not null default '',

  consent_recording boolean not null default false,
  consent_at timestamptz,

  main_pain_key text,
  commitment_level text check (commitment_level in ('nenhum', 'fraco', 'medio', 'forte', 'muito_forte')),
  commitment_notes text not null default '',
  general_notes text not null default '',

  price_accept_brl numeric(12, 2),
  price_too_expensive_brl numeric(12, 2),
  price_too_cheap_brl numeric(12, 2),

  audio_path text,
  audio_duration_seconds integer not null default 0
);

create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  question_key text not null,
  answer_text text not null default '',
  updated_at timestamptz not null default now(),
  unique (interview_id, question_key)
);

create table if not exists public.interview_feature_picks (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  feature_key text not null,
  rank smallint check (rank in (1, 2)),
  no_difference boolean not null default false,
  unique (interview_id, feature_key)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interviews_touch_updated_at on public.interviews;
create trigger interviews_touch_updated_at
  before update on public.interviews
  for each row execute function public.touch_updated_at();

drop trigger if exists interview_answers_touch_updated_at on public.interview_answers;
create trigger interview_answers_touch_updated_at
  before update on public.interview_answers
  for each row execute function public.touch_updated_at();

-- ============================================================
-- RLS: somente admin lê e escreve
-- ============================================================
alter table public.interviews enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_feature_picks enable row level security;

drop policy if exists "Admins gerenciam entrevistas" on public.interviews;
create policy "Admins gerenciam entrevistas"
  on public.interviews for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins gerenciam respostas" on public.interview_answers;
create policy "Admins gerenciam respostas"
  on public.interview_answers for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins gerenciam escolhas de funções" on public.interview_feature_picks;
create policy "Admins gerenciam escolhas de funções"
  on public.interview_feature_picks for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists interview_answers_interview_idx on public.interview_answers (interview_id);
create index if not exists interview_feature_picks_interview_idx on public.interview_feature_picks (interview_id);
create index if not exists interviews_created_at_idx on public.interviews (created_at desc);

-- ============================================================
-- Storage: bucket PRIVADO para os áudios das entrevistas
-- ============================================================
insert into storage.buckets (id, name, public)
values ('interview-audio', 'interview-audio', false)
on conflict (id) do nothing;

drop policy if exists "Admins leem áudios de entrevistas" on storage.objects;
create policy "Admins leem áudios de entrevistas"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'interview-audio' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins enviam áudios de entrevistas" on storage.objects;
create policy "Admins enviam áudios de entrevistas"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'interview-audio' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins atualizam áudios de entrevistas" on storage.objects;
create policy "Admins atualizam áudios de entrevistas"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'interview-audio' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'interview-audio' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins removem áudios de entrevistas" on storage.objects;
create policy "Admins removem áudios de entrevistas"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'interview-audio' and public.has_role(auth.uid(), 'admin'));
