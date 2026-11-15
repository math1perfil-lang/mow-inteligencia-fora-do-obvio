/**
 * Setores entrevistáveis. Cada setor tem o PRÓPRIO roteiro: contexto, dores, ferramentas
 * e valor são escritos para a realidade dele, com as dores e as funções candidatas dele.
 * Só a priorização e o encerramento seguem a mesma estrutura, porque medem compromisso.
 * Para criar um setor novo, acrescente um item em SECTORS: nenhuma tela nem migração muda.
 */

export type PriceField = "price_accept_brl" | "price_too_expensive_brl" | "price_too_cheap_brl";

export interface Question {
  key: string;
  label: string;
  /** Campo numérico em R$ que acompanha a pergunta. */
  price?: { field: PriceField; label: string };
}

export interface FeatureCandidate {
  key: string;
  title: string;
  description: string;
}

export interface Option {
  key: string;
  label: string;
}

/** Dor do setor. `theme` liga a dor a um tema comum, para comparar setores entre si. */
export interface PainOption extends Option {
  theme: string;
}

export interface Sector {
  key: string;
  label: string;
  description: string;
  /** "Nome da loja", "Nome do consultório"… */
  companyLabel: string;
  /** Como chamar o dono na fala: "lojista", "dentista"… */
  ownerNoun: string;
  /** Como chamar quem compra: "cliente", "paciente"… */
  clientNoun: string;
  sizeOptions: Option[];
  opening: string;
  /** Bloco 1: contexto e tamanho da operação. */
  context: Question[];
  /** Bloco 2: rotina e dores (a última pergunta é a de notas, chave terminada em _notes). */
  pain: Question[];
  /** As duas perguntas do bloco 2 cujas respostas aparecem na análise. */
  highlights: { key: string; label: string }[];
  /** Bloco 3: ferramentas atuais e gasto. */
  tools: Question[];
  /** Bloco 4: só as perguntas de custo da dor e de quem decide (os preços são padrão). */
  valueCost: Question;
  valueDecider: Question;
  painOptions: PainOption[];
  features: FeatureCandidate[];
}

const openingFor = (what: string) =>
  `Obrigado pelo tempo. Eu desenvolvo soluções para empresas e estou pesquisando como ${what} trabalham no dia a dia, para entender o que atrapalha. Não estou vendendo nada hoje. Não existe resposta certa ou errada: quanto mais real, melhor. Posso anotar e gravar o áudio? Leva uns 30 minutos.`;

const q = (key: string, label: string): Question => ({ key, label });

const themed = (prefix: string, list: [string, string, string][]): PainOption[] =>
  list.map(([key, label, theme]) => ({ key: `${prefix}_${key}`, label, theme }));

export const SECTORS: Sector[] = [
  // ------------------------------------------------------------------ carros
  {
    key: "revenda_carros",
    label: "Revenda de carros",
    description: "Lojas de veículos novos e seminovos",
    companyLabel: "Nome da loja",
    ownerNoun: "lojista",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Autônomo ou garagem (até 5 carros)" },
      { key: "pequena", label: "Pequena (5 a 20 carros)" },
      { key: "media", label: "Média (20 a 80 carros)" },
      { key: "grande", label: "Grande (80+ carros)" },
    ],
    opening: openingFor("as revendas de carros"),
    context: [
      q("car_c1", "Há quanto tempo a loja existe e quantas pessoas trabalham nela (vendedores, administrativo, mecânica)?"),
      q("car_c2", "Quantos carros tem em estoque hoje e quantos vende por mês, em média?"),
      q("car_c3", "Quanto tempo um carro leva para vender, em média? Qual é o que está parado há mais tempo?"),
      q("car_c4", "De onde vêm os clientes? (portais, redes sociais, indicação, passagem na porta) Qual traz mais venda de verdade?"),
      q("car_c5", "Que parte das vendas é financiada e que parte é à vista? Trabalha com carro na troca?"),
    ],
    pain: [
      q("car_d1", "Me conta como foi a última vez que um carro entrou no estoque, do momento em que chegou até estar anunciado. O que você fez, passo a passo?"),
      q("car_d2", "Qual é a tarefa que mais consome o tempo da equipe na semana?"),
      q("car_d3", "Qual foi a última venda que você perdeu? O que aconteceu entre o primeiro contato e o cliente sumir?"),
      q("car_d4", "Quando chega uma mensagem de portal ou WhatsApp, quanto tempo leva para alguém responder? E fora do horário ou aos sábados?"),
      q("car_d5", "Já anunciou um carro que já tinha sido vendido, ou errou preço ou dados do anúncio? Me conta o último caso."),
      q("car_d6", "Como decide o preço de compra e de venda de um carro? Em que se baseia e já errou feio?"),
      q("car_d7", "Como é o processo de documentação e transferência? Já ficou carro parado ou cliente esperando por papel?"),
      q("car_d8", "Como acompanha a aprovação de financiamento? O que acontece quando o banco demora ou nega?"),
      q("car_d9", "Como sabe quem visitou a loja e ficou de voltar? Alguém retorna esses contatos?"),
      q("car_d10", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("car_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "car_d2", label: "Tarefa que mais consome tempo" },
      { key: "car_d3", label: "Última venda perdida" },
    ],
    tools: [
      q("car_f1", "Que sistemas ou ferramentas a loja usa hoje? (gestão de estoque, planilha, CRM, anúncios, WhatsApp)"),
      q("car_f2", "Quanto paga por mês em cada um, incluindo portais de anúncio e tráfego pago?"),
      q("car_f3", "Do que mais gosta nessas ferramentas? Do que menos gosta?"),
      q("car_f4", "Já trocou de sistema alguma vez? Por quê?"),
      q("car_f5", "Se esses sistemas sumissem amanhã, o que quebraria na loja?"),
    ],
    valueCost: q("car_v1", "Pensando na tarefa mais cara da sua rotina, quanto ela custa para a loja por mês, em tempo ou em venda perdida?"),
    valueDecider: q("car_v5", "Quem na loja decide uma compra assim? Precisa de mais alguém, como sócio ou gerente?"),
    painOptions: themed("car", [
      ["portais", "Anúncios e publicação em portais", "captacao"],
      ["leads", "Leads sem resposta rápida", "atendimento"],
      ["estoque", "Estoque parado e giro lento", "estoque_compras"],
      ["preco", "Preço e avaliação do carro", "precificacao"],
      ["documentacao", "Documentação e transferência", "documentos"],
      ["financiamento", "Financiamento e aprovação de crédito", "cobranca"],
      ["equipe", "Equipe, metas e comissões", "equipe"],
      ["posvenda", "Pós-venda e recompra", "retencao"],
      ["sistemas", "Sistemas soltos e planilhas", "sistemas"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "publicacao_multiportais", title: "Publicação em vários portais", description: "Anunciar o carro uma vez e publicar em todos os portais de uma vez." },
      { key: "controle_anuncios", title: "Controle automático de anúncios", description: "Carro vendido sai do ar sozinho, sem contato perdido." },
      { key: "leads_whatsapp", title: "Leads e resposta rápida (WhatsApp)", description: "Nenhum interessado fica sem retorno no mesmo dia." },
      { key: "agenda_visitas", title: "Agenda de visitas e test-drives", description: "Cliente marca, a loja é avisada e ninguém esquece." },
      { key: "preco_mercado", title: "Sugestão de preço pelo mercado", description: "Preço do carro baseado no que a região está praticando." },
      { key: "ficha_veiculo", title: "Ficha do veículo com fotos e documentos", description: "Tudo do carro em um lugar só, sem papelada espalhada." },
    ],
  },

  // ------------------------------------------------------------------ odontologia
  {
    key: "odontologia",
    label: "Consultório odontológico",
    description: "Consultórios e clínicas de odontologia",
    companyLabel: "Nome do consultório",
    ownerNoun: "dentista",
    clientNoun: "paciente",
    sizeOptions: [
      { key: "solo", label: "Um profissional, uma cadeira" },
      { key: "pequena", label: "Pequena (2 a 3 cadeiras)" },
      { key: "media", label: "Média (4 a 8 cadeiras)" },
      { key: "grande", label: "Grande (9+ cadeiras ou rede)" },
    ],
    opening: openingFor("os consultórios odontológicos"),
    context: [
      q("odo_c1", "Há quanto tempo atende e quantos profissionais e auxiliares trabalham no consultório?"),
      q("odo_c2", "Quantos pacientes atende por semana e quantos deles são novos?"),
      q("odo_c3", "Que parte da receita vem de convênio e que parte é particular? Qual tratamento mais dá faturamento (implante, ortodontia, estética)?"),
      q("odo_c4", "Como os pacientes novos chegam? (indicação, Instagram, Google, convênio)"),
      q("odo_c5", "Quem cuida da agenda, da recepção e da cobrança? É você, uma secretária?"),
    ],
    pain: [
      q("odo_d1", "Me conta como foi o último paciente novo, desde o primeiro contato até a primeira consulta marcada. O que acontece em cada etapa e quem faz o quê?"),
      q("odo_d2", "Quantas faltas ou desmarcações em cima da hora tem por semana? O que faz com o horário vago?"),
      q("odo_d3", "De cada 10 orçamentos de tratamento que você apresenta, quantos o paciente aprova? O que faz com quem some?"),
      q("odo_d4", "Como você sabe que um paciente está atrasado para a revisão ou para dar continuidade ao tratamento? Isso acontece sem você perceber?"),
      q("odo_d5", "Como funciona o parcelamento de tratamentos? Já teve paciente que parou de pagar no meio? O que fez?"),
      q("odo_d6", "Já teve glosa de convênio ou pagamento que atrasou? Me conta o último caso e quanto tempo levou para resolver."),
      q("odo_d7", "Onde ficam o prontuário, as radiografias e os termos de consentimento? Já precisou de um documento e não achou?"),
      q("odo_d8", "Como controla o estoque de materiais? Já faltou algo no meio de um procedimento?"),
      q("odo_d9", "O que a recepção faz que toma mais tempo? Confirmar consulta, responder WhatsApp, cobrar?"),
      q("odo_d10", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("odo_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "odo_d2", label: "Faltas e horários vagos" },
      { key: "odo_d3", label: "Orçamentos não aprovados" },
    ],
    tools: [
      q("odo_f1", "Que software de gestão odontológica usa hoje, se usa? E planilha, agenda de papel, WhatsApp?"),
      q("odo_f2", "Quanto paga por mês em cada um?"),
      q("odo_f3", "Do que mais gosta nele? Do que menos gosta? O que ele não faz e você precisava?"),
      q("odo_f4", "Como confirma a consulta com o paciente hoje? Manual, mensagem, ligação?"),
      q("odo_f5", "Se esse sistema sumisse amanhã, o que quebraria no consultório?"),
    ],
    valueCost: q("odo_v1", "Pensando em faltas, orçamentos perdidos e inadimplência, quanto você estima que o consultório deixa de ganhar por mês?"),
    valueDecider: q("odo_v5", "Quem decide a contratação de um sistema ou serviço novo? Só você ou tem sócio?"),
    painOptions: themed("odo", [
      ["faltas", "Faltas e horários vagos na agenda", "agenda_faltas"],
      ["orcamentos", "Orçamentos não aprovados", "captacao"],
      ["retorno", "Retorno e reativação de pacientes", "retencao"],
      ["convenios", "Convênios, guias e glosas", "cobranca"],
      ["parcelas", "Inadimplência de tratamentos parcelados", "cobranca"],
      ["prontuario", "Prontuário, imagens e termos", "documentos"],
      ["materiais", "Estoque de materiais", "estoque_compras"],
      ["recepcao", "Recepção e atendimento no WhatsApp", "atendimento"],
      ["captacao", "Captação de pacientes novos", "captacao"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "odo_agenda_confirmacao", title: "Confirmação automática e lista de espera", description: "Paciente confirma sozinho e o horário vago é oferecido a quem espera." },
      { key: "odo_prontuario", title: "Prontuário e odontograma digital", description: "Histórico, imagens e termos do paciente em um lugar só." },
      { key: "odo_orcamento", title: "Orçamento e acompanhamento da aprovação", description: "Orçamento enviado pelo celular e lembrete automático para quem não respondeu." },
      { key: "odo_recall", title: "Retorno e reativação de pacientes", description: "Aviso automático de revisão, limpeza e tratamento parado." },
      { key: "odo_convenios", title: "Faturamento de convênios e glosas", description: "Guias organizadas, glosa identificada e recurso acompanhado." },
      { key: "odo_financeiro", title: "Cobrança de parcelas e fluxo de caixa", description: "Parcelas do tratamento cobradas e conciliadas sem planilha." },
    ],
  },

  // ------------------------------------------------------------------ engenharia
  {
    key: "engenharia",
    label: "Escritório de engenharia",
    description: "Engenharia, arquitetura e projetos",
    companyLabel: "Nome do escritório",
    ownerNoun: "engenheiro",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Profissional autônomo" },
      { key: "pequena", label: "Pequeno (2 a 5 pessoas)" },
      { key: "media", label: "Médio (6 a 20 pessoas)" },
      { key: "grande", label: "Grande (20+ pessoas)" },
    ],
    opening: openingFor("os escritórios de engenharia"),
    context: [
      q("eng_c1", "Há quanto tempo o escritório existe e quantas pessoas trabalham nele? Quantos são engenheiros, projetistas, administrativo?"),
      q("eng_c2", "Que tipos de projeto faz? (residencial, industrial, laudos, regularização, obra, elétrica, estrutural)"),
      q("eng_c3", "Quantos projetos ou obras tem em andamento ao mesmo tempo e qual o valor médio de um projeto?"),
      q("eng_c4", "Como chegam os clientes novos? Indicação, construtoras, licitação, site?"),
      q("eng_c5", "Quem monta as propostas, quem acompanha os prazos e quem cobra?"),
    ],
    pain: [
      q("eng_d1", "Me conta como foi o último projeto, desde o pedido do cliente até a entrega final. Quais foram as etapas e onde você mais teve que correr atrás?"),
      q("eng_d2", "Como monta uma proposta? Quanto tempo leva e de onde tira o preço? Já fechou um projeto no preço errado?"),
      q("eng_d3", "Qual foi o último projeto que atrasou ou estourou o orçamento? O que causou?"),
      q("eng_d4", "Como sabe quantas horas gastou em cada projeto? Isso volta para o preço da próxima proposta?"),
      q("eng_d5", "Como controla versões de projeto, documentos e aprovações do cliente? Já usou arquivo errado ou perdeu uma aprovação?"),
      q("eng_d6", "Como cobra: por etapa, por medição, parcela única? Já teve cliente que atrasou ou parou de pagar? Me conta o último caso."),
      q("eng_d7", "Como o cliente acompanha o andamento? Ele pergunta muito? O que mais toma seu tempo nessa comunicação?"),
      q("eng_d8", "Como distribui o trabalho entre a equipe? Já houve sobrecarga ou projeto sem ninguém cuidando?"),
      q("eng_d9", "E a parte de prefeitura, ART/RRT e órgãos públicos: o que trava mais e como acompanha os protocolos?"),
      q("eng_d10", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("eng_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "eng_d3", label: "Último projeto que atrasou" },
      { key: "eng_d6", label: "Cobrança e atraso de pagamento" },
    ],
    tools: [
      q("eng_f1", "Que softwares técnicos usa (CAD, BIM, cálculo) e quanto paga por mês em licenças?"),
      q("eng_f2", "E para gestão: planilha, e-mail, WhatsApp, algum sistema de projetos?"),
      q("eng_f3", "Do que mais gosta nessas ferramentas? Do que menos gosta?"),
      q("eng_f4", "Onde ficam arquivos e histórico dos projetos? Quanto tempo leva para achar algo de dois anos atrás?"),
      q("eng_f5", "Se esses sistemas sumissem amanhã, o que quebraria no escritório?"),
    ],
    valueCost: q("eng_v1", "Pensando em atrasos, retrabalho e horas não cobradas, quanto isso custa ao escritório por mês?"),
    valueDecider: q("eng_v5", "Quem decide a contratação de uma ferramenta nova? Só você ou os sócios também?"),
    painOptions: themed("eng", [
      ["propostas", "Propostas e orçamento", "precificacao"],
      ["prazos", "Prazos e atrasos de projeto", "equipe"],
      ["horas", "Horas e custo real por projeto", "precificacao"],
      ["documentos", "Documentos, versões e aprovações", "documentos"],
      ["cobranca", "Medição, faturamento e cobrança", "cobranca"],
      ["cliente", "Comunicação e acompanhamento do cliente", "atendimento"],
      ["captacao", "Captação de projetos novos", "captacao"],
      ["alocacao", "Alocação e sobrecarga da equipe", "equipe"],
      ["sistemas", "Licenças e sistemas soltos", "sistemas"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "eng_propostas", title: "Propostas e orçamentos padronizados", description: "Proposta pronta em minutos, com escopo e preço baseados nos projetos anteriores." },
      { key: "eng_prazos", title: "Controle de prazos e entregas", description: "Visão única de todos os projetos, com alerta de atraso." },
      { key: "eng_horas", title: "Horas e custo real por projeto", description: "Saber se cada projeto deu lucro e quanto custou de fato." },
      { key: "eng_documentos", title: "Documentos, versões e aprovações", description: "Última versão sempre à mão e aprovação do cliente registrada." },
      { key: "eng_cobranca", title: "Medições, faturamento e cobrança", description: "Medição gera a cobrança e avisa quando o cliente atrasa." },
      { key: "eng_cliente", title: "Portal de acompanhamento do cliente", description: "O cliente vê o andamento sozinho, sem ligar para perguntar." },
    ],
  },

  // ------------------------------------------------------------------ restaurantes
  {
    key: "restaurantes",
    label: "Restaurante ou lanchonete",
    description: "Restaurantes, bares, lanchonetes e delivery",
    companyLabel: "Nome do restaurante",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Operação enxuta (delivery, trailer, 1 a 3 pessoas)" },
      { key: "pequena", label: "Pequeno (até 10 pessoas)" },
      { key: "media", label: "Médio (10 a 30 pessoas)" },
      { key: "grande", label: "Grande (30+ pessoas ou várias unidades)" },
    ],
    opening: openingFor("os restaurantes e lanchonetes"),
    context: [
      q("res_c1", "Há quanto tempo o restaurante existe e quantas pessoas trabalham por turno (cozinha, salão, caixa)?"),
      q("res_c2", "Quantos clientes ou pedidos atende por dia e qual o ticket médio?"),
      q("res_c3", "Que parte das vendas é salão, retirada e delivery? Em quais aplicativos está?"),
      q("res_c4", "Quais são os dias e horários de pico e os mais fracos?"),
      q("res_c5", "Quem compra os insumos, quem gerencia a cozinha e quem fecha o caixa?"),
    ],
    pain: [
      q("res_d1", "Me conta como foi o último sábado, ou o dia mais corrido, desde abrir as portas até fechar o caixa. Onde as coisas travaram?"),
      q("res_d2", "Quanto de comida joga fora ou perde por semana? Como controla o estoque de insumos?"),
      q("res_d3", "Sabe a margem de cada prato? Quando foi a última vez que calculou o custo e o preço de venda?"),
      q("res_d4", "Quanto paga de comissão aos aplicativos de delivery por mês? Já tentou vender direto, pelo WhatsApp ou cardápio próprio?"),
      q("res_d5", "O que acontece no pico quando falta alguém ou um pedido atrasa? Qual foi o último problema sério?"),
      q("res_d6", "Como funciona reserva de mesa e fila de espera? Já perdeu cliente por causa disso?"),
      q("res_d7", "Como controla o caixa e o que entra e sai no dia? Já houve diferença de dinheiro sem explicação?"),
      q("res_d8", "Como é a rotina de contratar e treinar a equipe? Qual a rotatividade? Já faltou gente em dia importante?"),
      q("res_d9", "Como sabe quais clientes voltam? Faz algo para quem some?"),
      q("res_d10", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("res_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "res_d2", label: "Desperdício e estoque" },
      { key: "res_d5", label: "Problema no pico" },
    ],
    tools: [
      q("res_f1", "Que sistema de caixa e pedidos usa hoje? E planilha, caderno, impressora na cozinha?"),
      q("res_f2", "Quanto paga por mês em sistema, maquininha e aplicativos?"),
      q("res_f3", "Do que mais gosta no sistema atual? Do que menos gosta?"),
      q("res_f4", "Já trocou de sistema alguma vez? Por quê?"),
      q("res_f5", "Se o sistema do caixa caísse no sábado, o que aconteceria?"),
    ],
    valueCost: q("res_v1", "Somando desperdício, comissão de aplicativo e pedido perdido, quanto você estima que isso custa ao restaurante por mês?"),
    valueDecider: q("res_v5", "Quem decide trocar de sistema ou contratar algo novo? Só você ou sócio e gerente também?"),
    painOptions: themed("res", [
      ["desperdicio", "Desperdício e estoque de insumos", "estoque_compras"],
      ["cmv", "Custo dos pratos e margem", "precificacao"],
      ["delivery", "Comissão e gestão do delivery", "captacao"],
      ["pico", "Operação no pico e atrasos", "equipe"],
      ["reservas", "Reservas e fila de espera", "agenda_faltas"],
      ["fidelizacao", "Fidelização e recompra", "retencao"],
      ["caixa", "Caixa, conciliação e financeiro", "cobranca"],
      ["equipe", "Contratação e rotatividade da equipe", "equipe"],
      ["sistemas", "Sistemas soltos", "sistemas"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "rest_pedidos", title: "Pedidos e cardápio digital próprio", description: "O cliente pede direto pelo celular, sem comissão de aplicativo." },
      { key: "rest_estoque", title: "Estoque e ficha técnica", description: "Baixa automática dos insumos e alerta de compra e de desperdício." },
      { key: "rest_reservas", title: "Reservas e fila de espera", description: "Reserva confirmada por WhatsApp e fila organizada no pico." },
      { key: "rest_delivery", title: "Gestão do delivery em um painel só", description: "Pedidos de todos os aplicativos em uma tela, com entregadores." },
      { key: "rest_cmv", title: "Custo dos pratos e margem (CMV)", description: "Quanto cada prato realmente dá de lucro." },
      { key: "rest_fidelidade", title: "Fidelização e recompra por WhatsApp", description: "Cliente recebe oferta e cupom para voltar." },
    ],
  },

  // ------------------------------------------------------------------ salões
  {
    key: "saloes",
    label: "Salão de beleza ou barbearia",
    description: "Salões, barbearias, estética e studios",
    companyLabel: "Nome do salão",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Profissional autônomo ou 1 cadeira" },
      { key: "pequena", label: "Pequeno (2 a 5 profissionais)" },
      { key: "media", label: "Médio (6 a 15 profissionais)" },
      { key: "grande", label: "Grande (15+ ou várias unidades)" },
    ],
    opening: openingFor("os salões de beleza e barbearias"),
    context: [
      q("sal_c1", "Há quanto tempo o salão existe e quantos profissionais trabalham nele?"),
      q("sal_c2", "Os profissionais são funcionários, comissionados ou alugam a cadeira ou sala?"),
      q("sal_c3", "Quantos atendimentos faz por dia e qual o ticket médio? Qual serviço mais dá faturamento?"),
      q("sal_c4", "Como as clientes marcam horário hoje? WhatsApp, ligação, aplicativo, na recepção?"),
      q("sal_c5", "Que dias e horários ficam lotados e quais ficam vazios?"),
    ],
    pain: [
      q("sal_d1", "Me conta como foi o último dia cheio no salão, desde a primeira cliente marcada até o fechamento do caixa. O que deu trabalho?"),
      q("sal_d2", "Quantas faltas ou desistências em cima da hora tem por semana? O que faz com o horário vago?"),
      q("sal_d3", "Como calcula a comissão da equipe? Já teve erro ou discussão por causa disso? Quanto tempo leva o fechamento?"),
      q("sal_d4", "De cada 10 clientes, quantas voltam? Como sabe quando uma cliente sumiu e o que faz?"),
      q("sal_d5", "Como controla o estoque de produtos? Já faltou produto no meio do atendimento ou sobrou vencido?"),
      q("sal_d6", "Como controla o caixa? Já houve diferença, fiado esquecido ou serviço feito e não cobrado?"),
      q("sal_d7", "O que acontece quando um profissional falta ou sai levando as clientes?"),
      q("sal_d8", "Quem responde o WhatsApp e quanto tempo isso toma por dia? Já perdeu cliente por demora?"),
      q("sal_d9", "Como divulga o salão e o que traz mais clientes novas? Quanto investe?"),
      q("sal_d10", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("sal_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "sal_d2", label: "Faltas e horários vagos" },
      { key: "sal_d4", label: "Retorno das clientes" },
    ],
    tools: [
      q("sal_f1", "Usa algum sistema ou aplicativo de agenda e caixa? Ou caderno e WhatsApp?"),
      q("sal_f2", "Quanto paga por mês em sistema, maquininha e divulgação?"),
      q("sal_f3", "Do que mais gosta nele? Do que menos gosta?"),
      q("sal_f4", "A equipe usa de verdade ou volta para o caderno?"),
      q("sal_f5", "Se a agenda sumisse amanhã, o que quebraria no salão?"),
    ],
    valueCost: q("sal_v1", "Somando faltas, clientes que somem e erros de comissão ou caixa, quanto isso custa ao salão por mês?"),
    valueDecider: q("sal_v5", "Quem decide contratar um sistema novo? Só você ou sócio e gerente também?"),
    painOptions: themed("sal", [
      ["faltas", "Faltas e horários vagos", "agenda_faltas"],
      ["comissoes", "Comissões e fechamento da equipe", "equipe"],
      ["retorno", "Retorno e fidelização das clientes", "retencao"],
      ["estoque", "Estoque de produtos", "estoque_compras"],
      ["caixa", "Caixa e financeiro", "cobranca"],
      ["whatsapp", "Atendimento e agendamento no WhatsApp", "atendimento"],
      ["captacao", "Divulgação e clientes novas", "captacao"],
      ["equipe", "Faltas e saída de profissionais", "equipe"],
      ["sistemas", "Sistemas soltos e caderno", "sistemas"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "bel_agenda", title: "Agenda online com confirmação", description: "A cliente marca pelo link e confirma sozinha, sem WhatsApp manual." },
      { key: "bel_comissoes", title: "Comissões e fechamento da equipe", description: "Fechamento automático por profissional, sem planilha." },
      { key: "bel_fidelidade", title: "Pacotes, fidelidade e retorno", description: "Cliente que some recebe aviso e oferta para voltar." },
      { key: "bel_estoque", title: "Estoque de produtos", description: "Baixa por atendimento e alerta antes de acabar." },
      { key: "bel_caixa", title: "Caixa e financeiro simples", description: "Entradas, saídas e lucro do mês sem complicação." },
      { key: "bel_marketing", title: "Divulgação e reativação", description: "Mensagens prontas para clientes antigas e datas especiais." },
    ],
  },

  // ------------------------------------------------------------------ imobiliário
  {
    key: "imobiliario",
    label: "Imobiliária ou corretor",
    description: "Vendas, locação e administração de imóveis",
    companyLabel: "Nome da imobiliária",
    ownerNoun: "corretor",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Corretor autônomo" },
      { key: "pequena", label: "Pequena (2 a 5 corretores)" },
      { key: "media", label: "Média (6 a 20 corretores)" },
      { key: "grande", label: "Grande (20+ corretores ou várias filiais)" },
    ],
    opening: openingFor("as imobiliárias e corretores"),
    context: [
      q("imo_c1", "Há quanto tempo atua e quantas pessoas trabalham na imobiliária (corretores, administrativo, locação)?"),
      q("imo_c2", "Trabalha com venda, locação, administração de aluguéis ou tudo? Qual rende mais?"),
      q("imo_c3", "Quantos imóveis tem captados hoje e quantos negócios fecha por mês, em média?"),
      q("imo_c4", "De onde vêm os interessados? Portais, indicação, redes sociais, placa na rua? Qual dá mais negócio de verdade?"),
      q("imo_c5", "Se administra aluguéis: quantos contratos tem sob administração?"),
    ],
    pain: [
      q("imo_d1", "Me conta como foi o último negócio fechado, desde o primeiro contato do interessado até a assinatura. O que você fez em cada etapa?"),
      q("imo_d2", "Quando chega um lead de portal ou WhatsApp, quanto tempo leva para alguém responder? E fora do horário?"),
      q("imo_d3", "Qual foi o último negócio que você perdeu? Em que momento o cliente sumiu ou foi para outro?"),
      q("imo_d4", "Como capta imóveis novos? Qual é a maior dificuldade para conseguir exclusividade do proprietário?"),
      q("imo_d5", "Como organiza as visitas? Já houve visita marcada em duplicidade, esquecida ou sem a chave?"),
      q("imo_d6", "Como junta e confere a documentação de venda ou locação? Já travou negócio por papel faltando ou errado?"),
      q("imo_d7", "Quando um imóvel é vendido ou alugado, como remove o anúncio de todos os lugares? Já atendeu interessado em imóvel que não existe mais?"),
      q("imo_d8", "Na administração de aluguéis: quantos inquilinos atrasam por mês e como cobra? Como é o repasse ao proprietário?"),
      q("imo_d9", "Como faz vistoria de entrada e saída e acompanha manutenção? Já teve disputa por falta de registro?"),
      q("imo_d10", "Como divide e controla as comissões entre corretores? Já houve conflito ou erro?"),
      q("imo_d11", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("imo_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "imo_d2", label: "Tempo de resposta aos leads" },
      { key: "imo_d3", label: "Último negócio perdido" },
    ],
    tools: [
      q("imo_f1", "Que sistema ou CRM imobiliário usa hoje? E planilha, WhatsApp, portais?"),
      q("imo_f2", "Quanto paga por mês em sistema, portais de anúncio e divulgação?"),
      q("imo_f3", "Do que mais gosta nessas ferramentas? Do que menos gosta?"),
      q("imo_f4", "Os corretores usam de verdade ou fazem por fora no WhatsApp pessoal?"),
      q("imo_f5", "Se esses sistemas sumissem amanhã, o que quebraria na imobiliária?"),
    ],
    valueCost: q("imo_v1", "Somando lead que esfria, negócio perdido, atraso de aluguel e retrabalho, quanto isso custa à imobiliária por mês?"),
    valueDecider: q("imo_v5", "Quem decide a contratação de um sistema novo? Só você ou sócios e corretores também precisam aceitar?"),
    painOptions: themed("imo", [
      ["leads", "Leads sem resposta rápida e funil", "atendimento"],
      ["captacao_imoveis", "Captação de imóveis e exclusividade", "captacao"],
      ["visitas", "Agenda e organização de visitas", "agenda_faltas"],
      ["documentos", "Documentação e contratos", "documentos"],
      ["anuncios", "Anúncios desatualizados e portais", "sistemas"],
      ["inadimplencia", "Inadimplência de aluguel", "cobranca"],
      ["repasse", "Repasse ao proprietário e prestação de contas", "cobranca"],
      ["vistorias", "Vistorias e manutenção", "equipe"],
      ["comissoes", "Comissões e gestão dos corretores", "equipe"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "imo_leads", title: "Leads com resposta rápida e distribuição", description: "Todo interessado é respondido na hora e distribuído ao corretor certo." },
      { key: "imo_captacao", title: "Gestão de captação e proprietários", description: "Funil de captação com lembrete de contato e renovação de exclusividade." },
      { key: "imo_visitas", title: "Agenda de visitas com confirmação", description: "Visita marcada, confirmada e com a chave combinada, sem duplicidade." },
      { key: "imo_documentos", title: "Checklist de documentos e contratos", description: "Lista do que falta em cada negócio e contrato gerado pronto." },
      { key: "imo_locacao", title: "Cobrança de aluguel e repasse", description: "Boleto, aviso de atraso e repasse ao proprietário automáticos." },
      { key: "imo_vistorias", title: "Vistoria digital com fotos", description: "Laudo de entrada e saída no celular, com comparação das fotos." },
    ],
  },

  // ------------------------------------------------------------------ geral
  {
    key: "geral",
    label: "Outro setor",
    description: "Qualquer outro tipo de negócio (descreva o tipo ao criar)",
    companyLabel: "Nome da empresa",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Autônomo (1 pessoa)" },
      { key: "pequena", label: "Pequena (2 a 5 pessoas)" },
      { key: "media", label: "Média (6 a 20 pessoas)" },
      { key: "grande", label: "Grande (20+ pessoas)" },
    ],
    opening: openingFor("as empresas do seu segmento"),
    context: [
      q("ger_c1", "Em uma frase, o que a empresa vende e como ganha dinheiro?"),
      q("ger_c2", "Há quanto tempo existe e quantas pessoas trabalham nela?"),
      q("ger_c3", "Quantos clientes atende por mês e qual o valor médio de cada venda?"),
      q("ger_c4", "De onde vêm os clientes novos?"),
      q("ger_c5", "Qual é a atividade em que mais depende de pessoas ou de papel?"),
    ],
    pain: [
      q("ger_d1", "Me conta como foi a última vez que você atendeu um cliente novo, desde o primeiro contato até receber o pagamento. O que fez, passo a passo?"),
      q("ger_d2", "Qual é a tarefa que mais consome o tempo da equipe na semana?"),
      q("ger_d3", "Qual foi a última vez que perdeu um cliente ou uma venda? O que aconteceu?"),
      q("ger_d4", "Já perdeu dinheiro por esquecimento, erro ou falta de controle? Me conta o último caso."),
      q("ger_d5", "Que informação você gostaria de ter todo dia e hoje não tem?"),
      q("ger_d6", "O que acontece com a empresa quando você tira uma semana de férias?"),
      q("ger_d7", "Qual tarefa repetitiva você ou a equipe faz que daria para ser automática?"),
      q("ger_d8", "Como controla o que tem a receber e quem está devendo?"),
      q("ger_d9", "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?"),
      q("ger_notes", "Notas de aprofundamento"),
    ],
    highlights: [
      { key: "ger_d2", label: "Tarefa que mais consome tempo" },
      { key: "ger_d3", label: "Última venda perdida" },
    ],
    tools: [
      q("ger_f1", "Que sistemas ou ferramentas usa hoje? (planilha, agenda, WhatsApp, algum sistema)"),
      q("ger_f2", "Quanto paga por mês em cada um?"),
      q("ger_f3", "Onde ficam os dados dos clientes hoje? Caderno, planilha, WhatsApp, sistema?"),
      q("ger_f4", "Do que mais gosta nessas ferramentas? Do que menos gosta?"),
      q("ger_f5", "Se esses sistemas sumissem amanhã, o que quebraria?"),
    ],
    valueCost: q("ger_v1", "Pensando na tarefa mais cara da sua rotina, quanto ela custa para o negócio por mês, em tempo ou em dinheiro perdido?"),
    valueDecider: q("ger_v5", "Quem decide uma compra assim? Precisa de mais alguém?"),
    painOptions: themed("ger", [
      ["agenda", "Agenda e faltas", "agenda_faltas"],
      ["atendimento", "Atendimento e retorno a clientes", "atendimento"],
      ["cobranca", "Cobrança e caixa", "cobranca"],
      ["documentos", "Documentos e cadastros", "documentos"],
      ["estoque", "Estoque e compras", "estoque_compras"],
      ["equipe", "Equipe e processos", "equipe"],
      ["captacao", "Captação de clientes", "captacao"],
      ["retencao", "Retenção e recompra", "retencao"],
      ["preco", "Preço, margem e custo real", "precificacao"],
      ["sistemas", "Sistemas soltos e planilhas", "sistemas"],
      ["outra", "Outra dor", "outra"],
    ]),
    features: [
      { key: "ger_agenda", title: "Agenda e lembretes automáticos", description: "Compromissos organizados e cliente avisado sozinho." },
      { key: "ger_atendimento", title: "Atendimento e retorno a clientes", description: "Nenhum contato fica sem resposta e todo mundo é acompanhado." },
      { key: "ger_cobranca", title: "Cobrança e contas a receber", description: "Quem deve é avisado automaticamente e o caixa é previsível." },
      { key: "ger_documentos", title: "Documentos e cadastros organizados", description: "Tudo do cliente em um lugar só, sem papelada." },
      { key: "ger_painel", title: "Painel com os números do negócio", description: "Vendas, caixa e metas em uma tela simples." },
      { key: "ger_automacao", title: "Automação de tarefas repetitivas", description: "O que se repete toda semana passa a acontecer sozinho." },
    ],
  },
];

export function getSector(key: string | null | undefined): Sector {
  return SECTORS.find((s) => s.key === key) ?? SECTORS[SECTORS.length - 1]!;
}

/** Nome para exibir: no setor "Outro", o tipo de negócio digitado. */
export function sectorDisplayName(key: string, custom: string): string {
  const sector = getSector(key);
  return sector.key === "geral" && custom.trim() ? custom.trim() : sector.label;
}

export const ALL_FEATURES: (FeatureCandidate & { sectorKey: string })[] = SECTORS.flatMap((s) =>
  s.features.map((f) => ({ ...f, sectorKey: s.key })),
);

export const ALL_PAIN_OPTIONS: PainOption[] = SECTORS.flatMap((s) => s.painOptions);

export function painLabel(key: string | null): string {
  if (!key) return "—";
  return ALL_PAIN_OPTIONS.find((p) => p.key === key)?.label ?? key;
}

/** Tema comum de uma dor, para comparar setores. */
export function painTheme(key: string | null): string | null {
  if (!key) return null;
  return ALL_PAIN_OPTIONS.find((p) => p.key === key)?.theme ?? null;
}
