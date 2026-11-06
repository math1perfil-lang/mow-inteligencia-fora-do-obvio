export type Lang = "pt" | "en" | "es";
export const LANGS: Lang[] = ["pt", "en", "es"];

const pt = {
  langName: "Português",
  chooseTitle: "Escolha o idioma",
  chooseSub: "Selecione como deseja navegar pelo site.",
  langLabel: "Idioma",
  skip: "Pular para o conteúdo",
  nav: ["Início", "O que fazemos", "Projetos", "Sobre", "Contato"],
  talk: "Vamos conversar ↗",
  menu: "Menu", close: "Fechar",
  heroEyebrow: "MOW® — Estúdio de soluções",
  heroLines: ["Inteligência", "fora do", "óbvio"],
  heroText: "Desenvolvemos soluções que desafiam o convencional, conectam ideias e transformam possibilidades em realidade.",
  heroCta: "Conheça a MOW",
  discover: "Descubra a MOW ↓",
  tagline: "Inteligência fora do óbvio",
  m: {
    eyebrow: "01 / Nossa forma de pensar",
    title: "O óbvio já tem soluções demais.",
    p: [
      "Acreditamos que boas soluções começam com perguntas melhores. Questionamos o que parece definitivo, investigamos o que passa despercebido e encontramos novas formas de resolver problemas.",
      "Não criamos por criar. Pensamos, experimentamos e construímos com intenção.",
      "Porque inovação não é parecer diferente. É fazer diferente ter sentido.",
    ],
    quote: "“Não criamos por criar. Criamos porque existe uma maneira melhor.”",
  },
  w: {
    eyebrow: "02 / Possibilidades",
    t1: "Ideias são o começo.", t2: "Soluções são o objetivo.",
    text: "Cada desafio exige uma maneira própria de pensar. A MOW explora diferentes disciplinas para transformar problemas em oportunidades concretas.",
    services: [
      ["Estratégia e inovação", "Identificamos oportunidades, questionamos modelos existentes e estruturamos caminhos para novas soluções."],
      ["Produtos digitais", "Transformamos ideias em experiências digitais, plataformas e produtos pensados para resolver problemas reais."],
      ["Tecnologia e desenvolvimento", "Construímos soluções tecnológicas com foco em funcionalidade, clareza e utilidade."],
      ["Novos negócios e projetos", "Exploramos possibilidades, estruturamos iniciativas e desenvolvemos projetos com potencial de gerar valor."],
    ],
  },
  p: {
    eyebrow: "03 / Em desenvolvimento", title: "Ideias que ganham forma.",
    text: "Cada projeto é uma oportunidade de questionar o convencional e construir algo que faça sentido no mundo real.",
    more: "Conhecer o projeto ↗", soon: "Em breve", soonText: "Novas ideias estão tomando forma.",
  },
  d: {
    t1: "Não seguimos fórmulas.", t2: "Investigamos possibilidades.",
    items: [
      ["Pensamento independente", "Questionamos premissas antes de aceitar respostas prontas."],
      ["Inteligência aplicada", "Valorizamos ideias que encontram utilidade, propósito e aplicação prática."],
      ["Irreverência com intenção", "Desafiamos convenções quando existe uma razão para fazer diferente."],
    ],
  },
  a: {
    eyebrow: "04 / Quem somos", title: "Uma maneira diferente de enxergar problemas.",
    p: [
      "A MOW nasceu da inquietação diante de soluções previsíveis. Somos movidos pela curiosidade, pelo pensamento independente e pela vontade de transformar boas ideias em algo concreto.",
      "Nosso ponto de partida não é uma fórmula pronta. É o problema, a oportunidade e a pergunta que ainda não foi feita.",
      "Acreditamos que as melhores soluções surgem quando inteligência e criatividade trabalham juntas.",
    ],
  },
  c: {
    eyebrow: "05 / Contato", title: "Tem algo fora do óbvio em mente?",
    text: "Uma ideia, um desafio ou uma oportunidade? Vamos descobrir até onde ela pode chegar.",
    fields: { name: "Nome", email: "E-mail", company: "Empresa", subject: "Assunto", message: "Mensagem" },
    optional: " (opcional)", send: "Enviar mensagem", sending: "Enviando…",
    ok: "Mensagem enviada. Responderemos em breve.",
    errs: { name: "Informe seu nome.", email: "E-mail inválido.", subject: "Informe um assunto.", message: "Escreva ao menos 10 caracteres.", company: "Texto muito longo." },
    server: {
      not_configured: "O envio de mensagens ainda não está configurado. Tente novamente em breve.",
      send_failed: "Não foi possível enviar agora. Tente novamente em instantes.",
      network: "Falha de conexão ao enviar. Tente novamente.",
    },
  },
  f: { footerNav: "Rodapé", privacy: "Política de privacidade", rights: "Todos os direitos reservados.", motto: "Menos do mesmo. Mais inteligência." },
};
export type Dict = typeof pt;

const en: Dict = {
  langName: "English",
  chooseTitle: "Choose your language",
  chooseSub: "Select how you'd like to browse the site.",
  langLabel: "Language",
  skip: "Skip to content",
  nav: ["Home", "What we do", "Projects", "About", "Contact"],
  talk: "Let's talk ↗",
  menu: "Menu", close: "Close",
  heroEyebrow: "MOW® — Solutions studio",
  heroLines: ["Intelligence", "beyond the", "obvious"],
  heroText: "We build solutions that challenge the conventional, connect ideas and turn possibilities into reality.",
  heroCta: "Meet MOW",
  discover: "Discover MOW ↓",
  tagline: "Intelligence beyond the obvious",
  m: {
    eyebrow: "01 / How we think",
    title: "The obvious already has too many solutions.",
    p: [
      "We believe good solutions start with better questions. We question what seems final, investigate what goes unnoticed and find new ways to solve problems.",
      "We don't create for the sake of creating. We think, experiment and build with intention.",
      "Because innovation isn't about looking different. It's about making different make sense.",
    ],
    quote: "“We don't create for the sake of it. We create because there is a better way.”",
  },
  w: {
    eyebrow: "02 / Possibilities",
    t1: "Ideas are the beginning.", t2: "Solutions are the goal.",
    text: "Every challenge demands its own way of thinking. MOW explores different disciplines to turn problems into concrete opportunities.",
    services: [
      ["Strategy and innovation", "We identify opportunities, question existing models and map out paths to new solutions."],
      ["Digital products", "We turn ideas into digital experiences, platforms and products designed to solve real problems."],
      ["Technology and development", "We build technology solutions focused on functionality, clarity and usefulness."],
      ["New ventures and projects", "We explore possibilities, structure initiatives and develop projects with the potential to create value."],
    ],
  },
  p: {
    eyebrow: "03 / In development", title: "Ideas taking shape.",
    text: "Every project is a chance to question the conventional and build something that makes sense in the real world.",
    more: "See the project ↗", soon: "Coming soon", soonText: "New ideas are taking shape.",
  },
  d: {
    t1: "We don't follow formulas.", t2: "We investigate possibilities.",
    items: [
      ["Independent thinking", "We question assumptions before accepting ready-made answers."],
      ["Applied intelligence", "We value ideas that find usefulness, purpose and practical application."],
      ["Irreverence with intent", "We challenge conventions when there is a reason to do things differently."],
    ],
  },
  a: {
    eyebrow: "04 / Who we are", title: "A different way of seeing problems.",
    p: [
      "MOW was born from restlessness with predictable solutions. We are driven by curiosity, independent thinking and the will to turn good ideas into something concrete.",
      "Our starting point isn't a ready-made formula. It's the problem, the opportunity and the question no one has asked yet.",
      "We believe the best solutions emerge when intelligence and creativity work together.",
    ],
  },
  c: {
    eyebrow: "05 / Contact", title: "Got something beyond the obvious in mind?",
    text: "An idea, a challenge or an opportunity? Let's find out how far it can go.",
    fields: { name: "Name", email: "Email", company: "Company", subject: "Subject", message: "Message" },
    optional: " (optional)", send: "Send message", sending: "Sending…",
    ok: "Message sent. We'll get back to you soon.",
    errs: { name: "Please enter your name.", email: "Invalid email.", subject: "Please enter a subject.", message: "Write at least 10 characters.", company: "Text too long." },
    server: {
      not_configured: "Message sending isn't set up yet. Please try again soon.",
      send_failed: "Couldn't send right now. Please try again shortly.",
      network: "Connection failed while sending. Please try again.",
    },
  },
  f: { footerNav: "Footer", privacy: "Privacy policy", rights: "All rights reserved.", motto: "Less of the same. More intelligence." },
};

const es: Dict = {
  langName: "Español",
  chooseTitle: "Elige el idioma",
  chooseSub: "Selecciona cómo quieres navegar por el sitio.",
  langLabel: "Idioma",
  skip: "Saltar al contenido",
  nav: ["Inicio", "Qué hacemos", "Proyectos", "Nosotros", "Contacto"],
  talk: "Hablemos ↗",
  menu: "Menú", close: "Cerrar",
  heroEyebrow: "MOW® — Estudio de soluciones",
  heroLines: ["Inteligencia", "fuera de lo", "obvio"],
  heroText: "Desarrollamos soluciones que desafían lo convencional, conectan ideas y transforman posibilidades en realidad.",
  heroCta: "Conoce MOW",
  discover: "Descubre MOW ↓",
  tagline: "Inteligencia fuera de lo obvio",
  m: {
    eyebrow: "01 / Nuestra forma de pensar",
    title: "Lo obvio ya tiene demasiadas soluciones.",
    p: [
      "Creemos que las buenas soluciones empiezan con mejores preguntas. Cuestionamos lo que parece definitivo, investigamos lo que pasa desapercibido y encontramos nuevas formas de resolver problemas.",
      "No creamos por crear. Pensamos, experimentamos y construimos con intención.",
      "Porque innovar no es parecer diferente. Es hacer que lo diferente tenga sentido.",
    ],
    quote: "“No creamos por crear. Creamos porque existe una manera mejor.”",
  },
  w: {
    eyebrow: "02 / Posibilidades",
    t1: "Las ideas son el comienzo.", t2: "Las soluciones son el objetivo.",
    text: "Cada desafío exige una forma propia de pensar. MOW explora distintas disciplinas para transformar problemas en oportunidades concretas.",
    services: [
      ["Estrategia e innovación", "Identificamos oportunidades, cuestionamos modelos existentes y estructuramos caminos hacia nuevas soluciones."],
      ["Productos digitales", "Transformamos ideas en experiencias digitales, plataformas y productos pensados para resolver problemas reales."],
      ["Tecnología y desarrollo", "Construimos soluciones tecnológicas centradas en la funcionalidad, la claridad y la utilidad."],
      ["Nuevos negocios y proyectos", "Exploramos posibilidades, estructuramos iniciativas y desarrollamos proyectos con potencial de generar valor."],
    ],
  },
  p: {
    eyebrow: "03 / En desarrollo", title: "Ideas que toman forma.",
    text: "Cada proyecto es una oportunidad para cuestionar lo convencional y construir algo que tenga sentido en el mundo real.",
    more: "Conocer el proyecto ↗", soon: "Próximamente", soonText: "Nuevas ideas están tomando forma.",
  },
  d: {
    t1: "No seguimos fórmulas.", t2: "Investigamos posibilidades.",
    items: [
      ["Pensamiento independiente", "Cuestionamos premisas antes de aceptar respuestas prefabricadas."],
      ["Inteligencia aplicada", "Valoramos las ideas que encuentran utilidad, propósito y aplicación práctica."],
      ["Irreverencia con intención", "Desafiamos convenciones cuando hay una razón para hacerlo diferente."],
    ],
  },
  a: {
    eyebrow: "04 / Quiénes somos", title: "Una manera diferente de ver los problemas.",
    p: [
      "MOW nació de la inquietud ante soluciones previsibles. Nos mueve la curiosidad, el pensamiento independiente y las ganas de convertir buenas ideas en algo concreto.",
      "Nuestro punto de partida no es una fórmula hecha. Es el problema, la oportunidad y la pregunta que aún no se ha hecho.",
      "Creemos que las mejores soluciones surgen cuando la inteligencia y la creatividad trabajan juntas.",
    ],
  },
  c: {
    eyebrow: "05 / Contacto", title: "¿Tienes algo fuera de lo obvio en mente?",
    text: "¿Una idea, un desafío o una oportunidad? Descubramos hasta dónde puede llegar.",
    fields: { name: "Nombre", email: "Correo electrónico", company: "Empresa", subject: "Asunto", message: "Mensaje" },
    optional: " (opcional)", send: "Enviar mensaje", sending: "Enviando…",
    ok: "Mensaje enviado. Responderemos pronto.",
    errs: { name: "Indica tu nombre.", email: "Correo no válido.", subject: "Indica un asunto.", message: "Escribe al menos 10 caracteres.", company: "Texto demasiado largo." },
    server: {
      not_configured: "El envío de mensajes aún no está configurado. Inténtalo de nuevo pronto.",
      send_failed: "No se pudo enviar ahora. Inténtalo de nuevo en unos instantes.",
      network: "Fallo de conexión al enviar. Inténtalo de nuevo.",
    },
  },
  f: { footerNav: "Pie de página", privacy: "Política de privacidad", rights: "Todos los derechos reservados.", motto: "Menos de lo mismo. Más inteligencia." },
};

export const DICTS: Record<Lang, Dict> = { pt, en, es };
export const HTML_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en", es: "es" };
