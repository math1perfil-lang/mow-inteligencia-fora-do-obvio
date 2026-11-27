-- PROPOSTA PARA REVISÃO — NÃO APLICAR SEM REVISÃO DE SEGURANÇA.
-- Fica em docs/ de propósito: não está em supabase/migrations, então nada a executa sozinho.
-- Escopo: só o caminho convite -> briefing -> revisão (8 funções). Não inclui GKI, entrega ao
-- cliente nem aprovação de método (ver docs/method-factory-db-contract.md).
-- Validada em 2026-11-27 em transação desfeita (ver tests/). Não testada no banco real do app.
-- Princípio: tabelas fechadas (RLS ligada, sem policies, sem grants); todo acesso é por função
-- SECURITY DEFINER com search_path vazio.

begin;

-- 1. Operadores ---------------------------------------------------------------------------
create table if not exists public.mow_factory_operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Organizações e convites --------------------------------------------------------------
create table if not exists public.mow_factory_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  industry text not null default '' check (char_length(industry) <= 200),
  relationship_type text not null
    check (relationship_type in ('internal', 'related_company', 'external_pilot', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists public.mow_factory_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.mow_factory_organizations (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Briefings, dores e execuções de análise ------------------------------------------------
create table if not exists public.mow_factory_briefs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.mow_factory_organizations (id) on delete cascade,
  invite_id uuid not null unique references public.mow_factory_invites (id),
  status text not null default 'received'
    check (status in ('received', 'in_review', 'needs_clarification', 'approved_for_synthesis', 'archived')),
  payload jsonb not null,
  receipt_code text not null unique check (receipt_code ~ '^[A-F0-9]{10}$'),
  submitted_at timestamptz not null default now()
);

create table if not exists public.mow_factory_pain_points (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.mow_factory_briefs (id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null check (char_length(title) between 1 and 300),
  domain text not null check (char_length(domain) <= 200),
  urgency text not null check (char_length(urgency) <= 100),
  description text not null check (char_length(description) <= 10000),
  impact text not null default '' check (char_length(impact) <= 10000)
);

-- Ninguém no código grava aqui ainda; a tabela existe para a leitura da revisão.
create table if not exists public.mow_factory_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.mow_factory_briefs (id) on delete cascade,
  status text not null,
  method_version_id uuid,
  input_digest text,
  result jsonb,
  created_at timestamptz not null default now()
);

alter table public.mow_factory_operators enable row level security;
alter table public.mow_factory_organizations enable row level security;
alter table public.mow_factory_invites enable row level security;
alter table public.mow_factory_briefs enable row level security;
alter table public.mow_factory_pain_points enable row level security;
alter table public.mow_factory_analysis_runs enable row level security;

revoke all on public.mow_factory_operators, public.mow_factory_organizations,
  public.mow_factory_invites, public.mow_factory_briefs, public.mow_factory_pain_points,
  public.mow_factory_analysis_runs from public, anon, authenticated;

-- 4. Funções ------------------------------------------------------------------------------
create or replace function public.mow_factory_is_active_operator()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.mow_factory_operators o
    where o.user_id = (select auth.uid()) and o.active
  );
$$;

create or replace function public.mow_factory_create_invite(
  p_name text, p_industry text, p_relationship_type text, p_token_hash text, p_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid; v_invite uuid;
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '31 days' then
    raise exception 'invalid expiry' using errcode = '22023';
  end if;
  insert into public.mow_factory_organizations (name, industry, relationship_type)
    values (p_name, coalesce(p_industry, ''), p_relationship_type) returning id into v_org;
  insert into public.mow_factory_invites (organization_id, token_hash, expires_at, created_by)
    values (v_org, p_token_hash, p_expires_at, (select auth.uid())) returning id into v_invite;
  return v_invite;
end;
$$;

create or replace function public.mow_factory_revoke_invite(p_invite_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.mow_factory_invites set revoked_at = now()
    where id = p_invite_id and revoked_at is null and used_at is null;
  return found;
end;
$$;

-- Anônima: só diz se o hash corresponde a um convite utilizável.
create or replace function public.mow_factory_check_invite(p_token_hash text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.mow_factory_invites i
    where i.token_hash = p_token_hash
      and i.revoked_at is null and i.used_at is null and i.expires_at > now()
  );
$$;

-- Anônima: consome o convite (uso único) e grava briefing e dores numa só transação.
create or replace function public.mow_factory_submit_invited_brief(
  p_token_hash text, p_payload jsonb, p_pains jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_invite public.mow_factory_invites%rowtype; v_brief uuid; v_receipt text; v_pain jsonb; v_pos integer := 0;
begin
  if jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(p_pains) <> 'array'
     or jsonb_array_length(p_pains) not between 1 and 20
     or octet_length(p_payload::text) > 120000 then
    return jsonb_build_object('ok', false);
  end if;

  select * into v_invite from public.mow_factory_invites
    where token_hash = p_token_hash for update;
  if not found or v_invite.revoked_at is not null or v_invite.used_at is not null
     or v_invite.expires_at <= now() then
    return jsonb_build_object('ok', false);
  end if;

  v_receipt := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.mow_factory_briefs (organization_id, invite_id, payload, receipt_code)
    values (v_invite.organization_id, v_invite.id, p_payload, v_receipt) returning id into v_brief;

  for v_pain in select * from jsonb_array_elements(p_pains) loop
    insert into public.mow_factory_pain_points (brief_id, position, title, domain, urgency, description, impact)
      values (v_brief, v_pos, v_pain->>'title', v_pain->>'domain', v_pain->>'urgency',
              coalesce(v_pain->>'description', ''), coalesce(v_pain->>'impact', ''));
    v_pos := v_pos + 1;
  end loop;

  update public.mow_factory_invites set used_at = now() where id = v_invite.id;
  return jsonb_build_object('ok', true, 'receipt_code', v_receipt);
end;
$$;

create or replace function public.mow_factory_list_inbox()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', b.id, 'status', b.status, 'submitted_at', b.submitted_at,
      'organizations', jsonb_build_object('name', o.name, 'industry', o.industry,
                                          'relationship_type', o.relationship_type),
      'pain_points', coalesce((select jsonb_agg(jsonb_build_object(
          'title', p.title, 'domain', p.domain, 'urgency', p.urgency) order by p.position)
          from public.mow_factory_pain_points p where p.brief_id = b.id), '[]'::jsonb),
      'analysis_runs', coalesce((select jsonb_agg(jsonb_build_object(
          'id', r.id, 'status', r.status, 'created_at', r.created_at,
          'method_version_id', r.method_version_id))
          from public.mow_factory_analysis_runs r where r.brief_id = b.id), '[]'::jsonb)
    ) order by b.submitted_at desc)
    from public.mow_factory_briefs b
    join public.mow_factory_organizations o on o.id = b.organization_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.mow_factory_get_brief_review(p_brief_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'id', b.id, 'status', b.status, 'submitted_at', b.submitted_at, 'payload', b.payload,
      'pain_points', coalesce((select jsonb_agg(jsonb_build_object(
          'position', p.position, 'title', p.title, 'domain', p.domain, 'urgency', p.urgency,
          'description', p.description, 'impact', p.impact) order by p.position)
          from public.mow_factory_pain_points p where p.brief_id = b.id), '[]'::jsonb),
      'analysis_runs', coalesce((select jsonb_agg(jsonb_build_object(
          'id', r.id, 'status', r.status, 'created_at', r.created_at,
          'method_version_id', r.method_version_id, 'input_digest', r.input_digest,
          'result', r.result))
          from public.mow_factory_analysis_runs r where r.brief_id = b.id), '[]'::jsonb))
    from public.mow_factory_briefs b where b.id = p_brief_id
  );
end;
$$;

-- Só os três status que o código permite; "approved_for_synthesis" fica fora de propósito.
create or replace function public.mow_factory_update_brief_status(p_brief_id uuid, p_status text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('in_review', 'needs_clarification', 'archived') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  update public.mow_factory_briefs set status = p_status where id = p_brief_id;
  return found;
end;
$$;

-- 5. Permissões das funções ----------------------------------------------------------------
revoke all on function
  public.mow_factory_is_active_operator(), public.mow_factory_create_invite(text, text, text, text, timestamptz),
  public.mow_factory_revoke_invite(uuid), public.mow_factory_check_invite(text),
  public.mow_factory_submit_invited_brief(text, jsonb, jsonb), public.mow_factory_list_inbox(),
  public.mow_factory_get_brief_review(uuid), public.mow_factory_update_brief_status(uuid, text)
  from public, anon, authenticated;

grant execute on function public.mow_factory_check_invite(text) to anon, authenticated;
grant execute on function public.mow_factory_submit_invited_brief(text, jsonb, jsonb) to anon, authenticated;
grant execute on function
  public.mow_factory_is_active_operator(), public.mow_factory_create_invite(text, text, text, text, timestamptz),
  public.mow_factory_revoke_invite(uuid), public.mow_factory_list_inbox(),
  public.mow_factory_get_brief_review(uuid), public.mow_factory_update_brief_status(uuid, text)
  to authenticated;

commit;

-- Depois de aplicar (manual, pelo dono, no SQL Editor): cadastrar o primeiro operador.
--   insert into public.mow_factory_operators (user_id) values ('<uuid do usuário em auth.users>');
