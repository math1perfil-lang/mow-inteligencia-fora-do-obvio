-- Multi-setor: a entrevista passa a pertencer a um setor e a uma empresa qualquer.
-- Rode em três partes no SQL Editor do Supabase (cada parte é independente e repetível).

-- PARTE 1: renomeia colunas e remove checks antigos de porte
do $$
declare c record;
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'interviews' and column_name = 'store_name') then
    alter table public.interviews rename column store_name to company_name;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'interviews' and column_name = 'store_size') then
    alter table public.interviews rename column store_size to company_size;
  end if;
  for c in
    select conname from pg_constraint
    where conrelid = 'public.interviews'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%company_size%'
  loop
    execute format('alter table public.interviews drop constraint %I', c.conname);
  end loop;
end $$;

-- PARTE 2: novas colunas e ajuste dos dados existentes
alter table public.interviews
  add column if not exists sector_key text,
  add column if not exists sector_custom_name text not null default '',
  add column if not exists contact text not null default '',
  add column if not exists pain_severity smallint;

update public.interviews set sector_key = 'revenda_carros' where sector_key is null;
update public.interviews set company_size = null where company_size = 'ex_cliente';
update public.interviews set main_pain_key = null
where main_pain_key is not null and main_pain_key not in
  ('agenda_faltas','atendimento','cobranca','documentos','estoque_compras','equipe',
   'captacao','retencao','precificacao','sistemas','outra');

-- PARTE 3: regras finais
alter table public.interviews alter column sector_key set not null;
alter table public.interviews drop constraint if exists interviews_pain_severity_check;
alter table public.interviews
  add constraint interviews_pain_severity_check
  check (pain_severity is null or pain_severity between 1 and 5);
create index if not exists interviews_sector_idx on public.interviews (sector_key);
