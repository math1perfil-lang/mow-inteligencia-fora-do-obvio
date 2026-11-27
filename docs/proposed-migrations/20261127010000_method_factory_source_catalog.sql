-- PROPOSTA PARA REVISÃO — NÃO APLICAR SEM REVISÃO DE SEGURANÇA.
-- Depende de 20261127000000_method_factory_gki.sql (tabela gki_sources) e da migração de intake
-- (função mow_factory_is_active_operator).
-- Escopo: transformar gki_sources no ACERVO de fontes do Method Factory: metadados + resumo +
-- link aberto + licença, e texto completo em tabela separada. A importação em si (buscar na
-- OpenAlex e chamar estas funções) é código de servidor, fora deste arquivo.
-- Por decisão do dono, o acervo guarda texto completo; qual texto entra fica a cargo do importador.

begin;

alter table public.gki_sources
  add column if not exists domain text check (domain is null or char_length(domain) <= 200),
  add column if not exists provider text check (provider is null or char_length(provider) <= 100),
  add column if not exists provider_record_id text check (provider_record_id is null or char_length(provider_record_id) <= 300),
  add column if not exists doi text check (doi is null or char_length(doi) <= 500),
  add column if not exists publication_year integer check (publication_year is null or publication_year between 1400 and 3000),
  add column if not exists language text check (language is null or char_length(language) <= 64),
  add column if not exists authors text[] not null default '{}',
  add column if not exists abstract text check (abstract is null or char_length(abstract) <= 20000),
  add column if not exists open_access_url text,
  add column if not exists license text check (license is null or char_length(license) <= 500),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists gki_sources_provider_record_key
  on public.gki_sources (provider, provider_record_id) where provider is not null;
create index if not exists gki_sources_domain_idx on public.gki_sources (domain);
create index if not exists gki_sources_fts_idx on public.gki_sources
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(abstract, '')));

create table if not exists public.gki_source_texts (
  source_id uuid primary key references public.gki_sources (id) on delete cascade,
  text_content text not null check (char_length(text_content) between 1 and 2000000),
  text_format text not null default 'plain' check (text_format in ('plain', 'html_stripped', 'markdown')),
  license text check (license is null or char_length(license) <= 500),
  origin_url text,
  stored_by uuid not null references auth.users (id),
  fetched_at timestamptz not null default now()
);
alter table public.gki_source_texts enable row level security;
revoke all on public.gki_source_texts from public, anon, authenticated;

-- Importação em lote (até 100 itens). Reimportar o mesmo (provider, provider_record_id) atualiza.
create or replace function public.gki_upsert_sources_v1(p_domain text, p_items jsonb)
returns table (out_source_id uuid, out_record_id text, out_inserted boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_item jsonb; v_id uuid; v_ins boolean;
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'invalid items' using errcode = '22023';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.gki_sources as s (
      title, source_type, canonical_url, domain, provider, provider_record_id, doi, publication_year,
      language, authors, abstract, open_access_url, license, catalog_rights_status)
    values (
      v_item->>'title', coalesce(v_item->>'source_type', 'article'), v_item->>'canonical_url',
      nullif(p_domain, ''), v_item->>'provider', v_item->>'provider_record_id', v_item->>'doi',
      nullif(v_item->>'publication_year', '')::integer, v_item->>'language',
      coalesce(array(select jsonb_array_elements_text(v_item->'authors')), '{}'),
      v_item->>'abstract', v_item->>'open_access_url', v_item->>'license', 'pending')
    on conflict (provider, provider_record_id) where provider is not null do update set
      title = excluded.title, canonical_url = excluded.canonical_url,
      domain = coalesce(s.domain, excluded.domain), doi = excluded.doi,
      publication_year = excluded.publication_year, language = excluded.language,
      authors = excluded.authors, abstract = coalesce(excluded.abstract, s.abstract),
      open_access_url = excluded.open_access_url, license = excluded.license, updated_at = now()
    returning s.id, (xmax = 0) into v_id, v_ins;
    out_source_id := v_id; out_record_id := v_item->>'provider_record_id'; out_inserted := v_ins;
    return next;
  end loop;
end;
$$;

create or replace function public.gki_store_source_text_v1(
  p_source_id uuid, p_text text, p_format text default 'plain', p_license text default null, p_origin_url text default null
) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.gki_sources s where s.id = p_source_id) then
    raise exception 'source not found' using errcode = 'P0002';
  end if;
  insert into public.gki_source_texts as t (source_id, text_content, text_format, license, origin_url, stored_by)
    values (p_source_id, p_text, p_format, p_license, p_origin_url, (select auth.uid()))
  on conflict (source_id) do update set text_content = excluded.text_content,
    text_format = excluded.text_format, license = excluded.license, origin_url = excluded.origin_url,
    stored_by = excluded.stored_by, fetched_at = now();
  return true;
end;
$$;

create or replace function public.gki_get_source_text_v1(p_source_id uuid)
returns table (source_id uuid, title text, text_content text, text_format text, license text, origin_url text, fetched_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select s.id, s.title, t.text_content, t.text_format, t.license, t.origin_url, t.fetched_at
    from public.gki_sources s join public.gki_source_texts t on t.source_id = s.id
    where s.id = p_source_id;
end;
$$;

create or replace function public.gki_search_source_catalog_v1(
  p_search text default '', p_domain text default null, p_limit integer default 25
) returns table (
  source_id uuid, title text, source_type text, domain text, authors text[], publication_year integer,
  doi text, abstract text, open_access_url text, license text, has_full_text boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.mow_factory_is_active_operator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select s.id, s.title, s.source_type, s.domain, s.authors, s.publication_year, s.doi, s.abstract,
           s.open_access_url, s.license, exists (select 1 from public.gki_source_texts t where t.source_id = s.id)
    from public.gki_sources s
    where (p_domain is null or s.domain = p_domain)
      and (coalesce(p_search, '') = ''
           or to_tsvector('simple', coalesce(s.title, '') || ' ' || coalesce(s.abstract, ''))
              @@ websearch_to_tsquery('simple', p_search)
           or s.title ilike '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    order by s.publication_year desc nulls last, s.title
    limit least(greatest(coalesce(p_limit, 25), 1), 50);
end;
$$;

revoke all on function
  public.gki_upsert_sources_v1(text, jsonb), public.gki_store_source_text_v1(uuid, text, text, text, text),
  public.gki_get_source_text_v1(uuid), public.gki_search_source_catalog_v1(text, text, integer)
  from public, anon, authenticated;
grant execute on function
  public.gki_upsert_sources_v1(text, jsonb), public.gki_store_source_text_v1(uuid, text, text, text, text),
  public.gki_get_source_text_v1(uuid), public.gki_search_source_catalog_v1(text, text, integer)
  to authenticated;

commit;
