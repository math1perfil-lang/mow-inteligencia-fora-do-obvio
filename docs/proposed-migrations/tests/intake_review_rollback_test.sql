-- Teste descartável: roda a migração e um fluxo completo, e termina SEMPRE com uma exceção,
-- o que desfaz tudo (nada fica gravado). O resultado vem na mensagem do erro "RESULTADOS: ...".
-- Uso: colar a migração (sem begin/commit) depois de "begin;" e este bloco logo em seguida.
do $test$
declare
  v_op uuid := gen_random_uuid(); v_other uuid := gen_random_uuid();
  v_hash text := repeat('ab', 32); v_res jsonb := '[]'::jsonb;
  v_invite uuid; v_ok boolean; v_json jsonb; v_brief uuid; v_state text;
begin
  insert into auth.users (id, email) values (v_op, 'op@example.test'), (v_other, 'x@example.test');
  insert into public.mow_factory_operators (user_id) values (v_op);

  perform set_config('request.jwt.claims', json_build_object('sub', v_op, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_op::text, true);
  set local role authenticated;
  v_ok := public.mow_factory_is_active_operator();
  v_res := v_res || jsonb_build_object('operador_ativo', v_ok);
  v_invite := public.mow_factory_create_invite('Empresa Teste', 'Varejo', 'client', v_hash, now() + interval '7 days');
  v_res := v_res || jsonb_build_object('convite_criado', v_invite is not null);
  reset role;

  set local role anon;
  v_res := v_res || jsonb_build_object('check_antes', public.mow_factory_check_invite(v_hash));
  v_json := public.mow_factory_submit_invited_brief(v_hash, '{"x":"y"}'::jsonb,
    '[{"title":"Vendas fracas","domain":"Comercial e vendas","urgency":"Alta","description":"d","impact":"i"}]'::jsonb);
  v_res := v_res || jsonb_build_object('envio_ok', v_json->>'ok', 'recibo_formato', (v_json->>'receipt_code') ~ '^[A-F0-9]{10}$');
  v_res := v_res || jsonb_build_object('check_depois', public.mow_factory_check_invite(v_hash));
  v_json := public.mow_factory_submit_invited_brief(v_hash, '{}'::jsonb, '[{"title":"a","domain":"b","urgency":"c"}]'::jsonb);
  v_res := v_res || jsonb_build_object('reenvio_bloqueado', v_json->>'ok' = 'false');
  begin
    perform 1 from public.mow_factory_briefs;
    v_state := 'ACESSO_PERMITIDO';
  exception when insufficient_privilege then v_state := 'negado';
  end;
  v_res := v_res || jsonb_build_object('anon_le_tabela', v_state);
  begin
    perform public.mow_factory_list_inbox();
    v_state := 'ACESSO_PERMITIDO';
  exception when insufficient_privilege then v_state := 'negado';
  end;
  v_res := v_res || jsonb_build_object('anon_chama_inbox', v_state);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_other::text, true);
  set local role authenticated;
  begin
    perform public.mow_factory_list_inbox();
    v_state := 'ACESSO_PERMITIDO';
  exception when insufficient_privilege then v_state := 'negado';
  end;
  v_res := v_res || jsonb_build_object('nao_operador_inbox', v_state);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_op, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_op::text, true);
  set local role authenticated;
  v_json := public.mow_factory_list_inbox();
  v_brief := (v_json->0->>'id')::uuid;
  v_res := v_res || jsonb_build_object('inbox_itens', jsonb_array_length(v_json),
    'inbox_dor', v_json->0->'pain_points'->0->>'title', 'inbox_empresa', v_json->0->'organizations'->>'name');
  v_json := public.mow_factory_get_brief_review(v_brief);
  v_res := v_res || jsonb_build_object('revisao_dores', jsonb_array_length(v_json->'pain_points'),
    'revisao_payload', v_json->'payload');
  v_res := v_res || jsonb_build_object('status_in_review', public.mow_factory_update_brief_status(v_brief, 'in_review'));
  begin
    perform public.mow_factory_update_brief_status(v_brief, 'approved_for_synthesis');
    v_state := 'ACEITO';
  exception when others then v_state := 'recusado';
  end;
  v_res := v_res || jsonb_build_object('status_aprovado_via_rpc', v_state);
  reset role;

  raise exception 'RESULTADOS: %', v_res::text;
end
$test$;
