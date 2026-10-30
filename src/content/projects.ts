/**
 * Projetos da MOW. Adicione itens reais aqui; enquanto a lista estiver vazia,
 * o site mostra "Novas ideias estão tomando forma."
 */
export type Project = {
  name: string;
  category: string;
  description: string;
  /** URL de imagem (opcional) */
  image?: string;
  /** Página real do projeto (opcional) */
  url?: string;
};

export const PROJECTS: Project[] = [];

/** Perfis sociais — preencha apenas com endereços reais. */
export const SOCIAL: { label: string; href: string }[] = [
  // { label: "Instagram", href: "https://instagram.com/..." },
  // { label: "LinkedIn", href: "https://linkedin.com/company/..." },
];

/** Caminho da política de privacidade, quando publicada (ex.: "/privacidade"). */
export const PRIVACY_URL: string | null = null;
