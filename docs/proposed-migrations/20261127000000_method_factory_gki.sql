-- PROPOSTA PARA REVISÃO — NÃO APLICAR SEM REVISÃO DE SEGURANÇA.
-- Depende de 20261126000000_method_factory_intake_review.sql (tabela mow_factory_briefs e
-- função mow_factory_is_active_operator).
-- Escopo: as 7 funções gki_* (pesquisa, reserva, direitos de fontes, rascunho do método).
-- Direitos de fontes: por decisão do dono, aqui são só REGISTRO (guardam o que o operador
-- informa), sem regras que bloqueiem uso. Se quiser bloquear fontes com direito pendente ou
-- restrito, isso precisa ser acrescentado depois.
-- Nada grava em gki_sources no código atual; a tabela existe para a busca e a revisão.

begin;

create table if not exists public.gki_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 2000),
  source_type text not null check (char_length(source_type) between 1 and 200),
  canonical_url text,
  catalog_rights_status text not null default 'pending' check (char_length(catalog_rights_status) between 1 and 200),
  created_at timestamptz not null default now()
);

create table if not exists public.gki_source_rights_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.gki_sources (id) on delete cascade,
  decision_version integer not null check (decision_version > 0),
  decision_status text not null check (decision_status in (
    'pending', 'reference_only', 'open_license_verified', 'license_scoped',
    'explicit_permission', 'public_domain_verified', 'restricted', 'revoked')),
  permitted_uses text[] not null default '{}'
    check (permitted_uses <@ array['catalog_metadata', 'link_and_citation', 'internal_content_analysis',
      'commercial_method_derivation', 'store_full_text', 'publish_excerpt']),
  rights_basis text,
  rights_evidence_url text,
  restrictions text,
  restrictions_reviewed boolean not null default false,
  restrictions_satisfied boolean not null default false,
  valid_until date,
  reviewed_by uuid not null references auth.users (id),
  reviewed_at timestamptz not null default now(),
  unique (source_id, decision_version)
);

create table if not exists public.gki_research_runs (
  id uuid primary key default gen_random_uuid(),
  source_brief_id uuid not null references public.mow_factory_briefs (id) on delete cascade,
  question text not null check (char_length(question) between 1 and 2000),
  scope text not null default '' check (char_length(scope) <= 4000),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.gki_discovery_leases (
  token uuid primary key default gen_random_uuid(),
  research_run_id uuid not null references public.gki_research_runs (id) on delete cascade,
  acquired_by uuid not null references auth.users (id),
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz
);

create table if not exists public.gki_method_drafts (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.mow_factory_briefs (id) on delete cascade,
  draft jsonb not null,
  evidence_manifest jsonb not null,
  model_id text not null check (char_length(model_id) between 1 and 200),
  prompt_version text not null check (char_length(prompt_version) between 1 and 200),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.gki_sources enable row level security;
alter table public.gki_source_rights_reviews enable row level security;
alter table public.gki_research_runs enable row level security;
alter table public.gki_discovery_leases enable row level security;
alter table public.gki_method_drafts enable row level security;
revoke all on public.gki_sources, public.gki_source_rights_reviews, public.gki_research_runs,
  public.gki_discovery_leases, public.gki_method_drafts from public, anon, authenticated;

create or replace function public.gki_list_openalex_research_runs()
returns table (id uuid, question text, scope text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select r.id, r.question, r.scope, r.created_at
    from public.gki_research_runs r order by r.created_at desc limit 50;
end;
$$;

create or replace function public.gki_start_openalex_research_run(
  p_source_brief_id uuid, p_question text, p_scope text default ''
) returns table (id uuid, question text, scope text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_question, ''))) not between 1 and 2000 then
    raise exception 'invalid question' using errcode = '22023';
  end if;
  if not exists (select 1 from public.mow_factory_briefs b where b.id = p_source_brief_id) then
    raise exception 'brief not found' using errcode = 'P0002';
  end if;
  return query
    insert into public.gki_research_runs as r (source_brief_id, question, scope, created_by)
    values (p_source_brief_id, btrim(p_question), coalesce(p_scope, ''), (select auth.uid()))
    returning r.id, r.question, r.scope, r.created_at;
end;
$$;

-- Reserva exclusiva (10 min) para uma busca externa por execução.
create or replace function public.gki_acquire_openalex_discovery_lease(p_research_run_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_status text; v_token uuid;
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select r.status into v_status from public.gki_research_runs r
    where r.id = p_research_run_id for update;
  if not found then
    raise exception 'run not found' using errcode = 'P0002';
  end if;
  if v_status <> 'in_progress' then
    raise exception 'run not in progress' using errcode = '55000';
  end if;
  if exists (select 1 from public.gki_discovery_leases l
             where l.research_run_id = p_research_run_id and l.released_at is null and l.expires_at > now()) then
    raise exception 'lease already held' using errcode = '55P03';
  end if;
  insert into public.gki_discovery_leases (research_run_id, acquired_by, expires_at)
    values (p_research_run_id, (select auth.uid()), now() + interval '10 minutes')
    returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.gki_release_openalex_discovery_lease(p_lease_token uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.gki_discovery_leases set released_at = now()
    where token = p_lease_token and released_at is null and acquired_by = (select auth.uid());
  return found;
end;
$$;

create or replace function public.gki_search_source_rights_reviews_v1(p_search text, p_limit integer default 25)
returns table (
  source_id uuid, title text, source_type text, canonical_url text, catalog_rights_status text,
  rights_review_id uuid, decision_status text, permitted_uses text[], rights_basis text,
  rights_evidence_url text, restrictions text, reviewed_by uuid, reviewed_at timestamptz,
  valid_until date, restrictions_reviewed boolean, restrictions_satisfied boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select s.id, s.title, s.source_type, s.canonical_url, s.catalog_rights_status,
           v.id, v.decision_status, v.permitted_uses, v.rights_basis, v.rights_evidence_url,
           v.restrictions, v.reviewed_by, v.reviewed_at, v.valid_until,
           v.restrictions_reviewed, v.restrictions_satisfied
    from public.gki_sources s
    left join lateral (
      select * from public.gki_source_rights_reviews x
      where x.source_id = s.id order by x.decision_version desc limit 1) v on true
    where coalesce(p_search, '') = ''
       or s.title ilike '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    order by s.title
    limit least(greatest(coalesce(p_limit, 25), 1), 50);
end;
$$;

-- Registro simples: guarda o que o operador informou, versionando por fonte.
create or replace function public.gki_record_source_rights_review_v1(p_source_id uuid, p_review_input jsonb)
returns table (
  rights_review_id uuid, source_id uuid, decision_version integer, decision_status text,
  permitted_uses text[], reviewed_by uuid, reviewed_at timestamptz, valid_until date,
  restrictions_reviewed boolean, restrictions_satisfied boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_version integer;
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform 1 from public.gki_sources s where s.id = p_source_id for update;
  if not found then
    raise exception 'source not found' using errcode = 'P0002';
  end if;
  select coalesce(max(x.decision_version), 0) + 1 into v_version
    from public.gki_source_rights_reviews x where x.source_id = p_source_id;
  return query
    insert into public.gki_source_rights_reviews as n (
      source_id, decision_version, decision_status, permitted_uses, rights_basis, rights_evidence_url,
      restrictions, restrictions_reviewed, restrictions_satisfied, valid_until, reviewed_by)
    values (
      p_source_id, v_version, p_review_input->>'decision_status',
      coalesce(array(select jsonb_array_elements_text(p_review_input->'permitted_uses')), '{}'),
      p_review_input->>'rights_basis', p_review_input->>'rights_evidence_url',
      p_review_input->>'restrictions',
      coalesce((p_review_input->>'restrictions_reviewed')::boolean, false),
      coalesce((p_review_input->>'restrictions_satisfied')::boolean, false),
      nullif(p_review_input->>'valid_until', '')::date, (select auth.uid()))
    returning n.id, n.source_id, n.decision_version, n.decision_status, n.permitted_uses,
              n.reviewed_by, n.reviewed_at, n.valid_until, n.restrictions_reviewed, n.restrictions_satisfied;
end;
$$;

create or replace function public.gki_record_method_draft_v1(
  p_brief_id uuid, p_draft jsonb, p_evidence_manifest jsonb, p_model_id text, p_prompt_version text
) returns table (draft_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.mow_factory_briefs b where b.id = p_brief_id) then
    raise exception 'brief not found' using errcode = 'P0002';
  end if;
  return query
    insert into public.gki_method_drafts as d (brief_id, draft, evidence_manifest, model_id, prompt_version, created_by)
    values (p_brief_id, p_draft, p_evidence_manifest, p_model_id, p_prompt_version, (select auth.uid()))
    returning d.id, d.created_at;
end;
$$;

revoke all on function
  public.gki_list_openalex_research_runs(), public.gki_start_openalex_research_run(uuid, text, text),
  public.gki_acquire_openalex_discovery_lease(uuid), public.gki_release_openalex_discovery_lease(uuid),
  public.gki_search_source_rights_reviews_v1(text, integer),
  public.gki_record_source_rights_review_v1(uuid, jsonb),
  public.gki_record_method_draft_v1(uuid, jsonb, jsonb, text, text)
  from public, anon, authenticated;
grant execute on function
  public.gki_list_openalex_research_runs(), public.gki_start_openalex_research_run(uuid, text, text),
  public.gki_acquire_openalex_discovery_lease(uuid), public.gki_release_openalex_discovery_lease(uuid),
  public.gki_search_source_rights_reviews_v1(text, integer),
  public.gki_record_source_rights_review_v1(uuid, jsonb),
  public.gki_record_method_draft_v1(uuid, jsonb, jsonb, text, text)
  to authenticated;

commit;
