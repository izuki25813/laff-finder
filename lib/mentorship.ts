export type MentorshipModality = "individual" | "collective";
export type MentorshipProductType = "diagnostic" | "mentoring";

export type MentorshipProduct = {
  id: string;
  slug: string;
  name: string;
  productType: MentorshipProductType;
  modality?: MentorshipModality;
  tier?: 1 | 2 | 3;
  shortDescription: string;
  description: string;
  price: number | null;
  priceLabel: string;
  currency: "BRL";
  sessionsIncluded?: number;
  durationDays?: number;
  target: string;
  active: boolean;
  featured?: boolean;
  sortOrder: number;
  features: string[];
  cta: string;
};

export const MENTORSHIP_COMMERCIAL_CONFIG = {
  diagnostic: {
    price: 39,
    currency: "BRL",
    label: "R$ 39",
  },
  planReference: {
    // Preços de planos ainda não aprovados oficialmente.
    // Mantém-se como valores configuráveis no centro do produto para facilitar ajuste futuro.
    individualLevel1: "A definir",
    individualLevel2: "A definir",
    individualLevel3: "A definir",
    collectiveLevel1: "A definir",
    collectiveLevel2: "A definir",
    collectiveLevel3: "A definir",
  },
} as const;

export const MENTORSHIP_PRODUCTS: MentorshipProduct[] = [
  {
    id: "prod-diagnostic",
    slug: "diagnostico",
    name: "Diagnóstico",
    productType: "diagnostic",
    shortDescription: "Diagnóstico inicial para entender sua base e os principais pontos a melhorar.",
    description:
      "Produto de entrada pensado para jogadores que querem entender o que está travando a evolução. O diagnóstico inclui análise de gameplay/clipe, priorização de erros, pontos fortes e exercícios personalizados.",
    price: MENTORSHIP_COMMERCIAL_CONFIG.diagnostic.price,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.diagnostic.label,
    currency: "BRL",
    target: "Jogadores que querem entender melhor seu nível e identificar os principais gargalos.",
    active: true,
    featured: true,
    sortOrder: 1,
    features: [
      "Análise de 1 gameplay/clipe",
      "3 principais erros apontados",
      "Pontos fortes e pontos de atenção",
      "Diagnóstico de tomada de decisão e posicionamento",
      "3 exercícios personalizados",
      "Checklist de 10 erros que estão impedindo sua evolução",
    ],
    cta: "Solicitar diagnóstico",
  },
  {
    id: "plan-individual-1",
    slug: "mentoria-individual-nivel-1",
    name: "Mentoria Individual — Nível 1",
    productType: "mentoring",
    modality: "individual",
    tier: 1,
    shortDescription: "Estrutura inicial para jogadores que querem evoluir de maneira consistente.",
    description:
      "Solução com foco em mecânica, leitura de jogo, postura competitiva e organização da rotina de treino. Ideal para quem quer sair do nível básico e iniciar uma evolução estruturada.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.individualLevel1,
    currency: "BRL",
    sessionsIncluded: 4,
    durationDays: 30,
    target: "Jogadores em início de evolução que precisam de direção clara e plano consistente.",
    active: true,
    featured: true,
    sortOrder: 2,
    features: [
      "Diagnóstico inicial e objetivos claros",
      "Plano de evolução com foco em base competitiva",
      "Acompanhamento estruturado",
      "Dicas de melhoria de posicionamento e tomada de decisão",
    ],
    cta: "Solicitar mentoria individual",
  },
  {
    id: "plan-individual-2",
    slug: "mentoria-individual-nivel-2",
    name: "Mentoria Individual — Nível 2",
    productType: "mentoring",
    modality: "individual",
    tier: 2,
    shortDescription: "Acompanhamento mais prático para quem já entende a base e quer acelerar o progresso.",
    description:
      "Ideal para jogadores que já têm base, mas ainda quebram em momentos decisivos. O foco é em consistência, pressão, leitura de partida e melhora real do jogo competitivo.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.individualLevel2,
    currency: "BRL",
    sessionsIncluded: 8,
    durationDays: 60,
    target: "Jogadores que já possuem base e querem evoluir para o próximo patamar competitivo.",
    active: true,
    featured: true,
    sortOrder: 3,
    features: [
      "Análise mais profunda de gameplay",
      "Correções em posicionamento e decisões",
      "Foco em consistência sob pressão",
      "Relatório de progresso e ajustes semanais",
    ],
    cta: "Solicitar nível 2",
  },
  {
    id: "plan-individual-3",
    slug: "mentoria-individual-nivel-3",
    name: "Mentoria Individual — Nível 3",
    productType: "mentoring",
    modality: "individual",
    tier: 3,
    shortDescription: "Programa de alto nível para quem quer evoluir de forma premium e direcionada.",
    description:
      "Padrão premium para jogadores que querem um acompanhamento mais próximo e focado em performance competitiva. A evolução passa pela organização do treino, leitura do jogo e tomada de decisão em contexto real.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.individualLevel3,
    currency: "BRL",
    sessionsIncluded: 12,
    durationDays: 90,
    target: "Jogadores com ambição competitiva, buscando alto nível de acompanhamento e estrutura.",
    active: true,
    sortOrder: 4,
    features: [
      "Acompanhamento mais próximo",
      "Foco em desafios competitivos de alto nível",
      "Planejamento e revisão de evolução",
      "Estratégia individual para evolução mais rápida",
    ],
    cta: "Solicitar nível 3",
  },
  {
    id: "plan-collective-1",
    slug: "mentoria-coletiva-nivel-1",
    name: "Mentoria Coletiva — Nível 1",
    productType: "mentoring",
    modality: "collective",
    tier: 1,
    shortDescription: "Estrutura inicial para squads que querem evoluir juntos.",
    description:
      "Para times que desejam melhorar comunicação, roles e tomada de decisão coletiva. A ideia é ajudar o squad a evoluir como unidade e reduzir erros de sincronização.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.collectiveLevel1,
    currency: "BRL",
    sessionsIncluded: 4,
    durationDays: 30,
    target: "Squads em formação que precisam mapear base, comunicação e sinergia.",
    active: true,
    sortOrder: 5,
    features: [
      "Diagnóstico do time e dos papéis",
      "Melhoria de rotação e comunicação",
      "Correções de padrões de equipe",
      "Planejamento para evolução em conjunto",
    ],
    cta: "Solicitar mentoria coletiva",
  },
  {
    id: "plan-collective-2",
    slug: "mentoria-coletiva-nivel-2",
    name: "Mentoria Coletiva — Nível 2",
    productType: "mentoring",
    modality: "collective",
    tier: 2,
    shortDescription: "Melhor sinergia para times que já possuem base e querem consistência em partidas.",
    description:
      "Foco em melhorar o time em momentos de pressão, decisões importantes e organização tática. Ideal para squads que querem evoluir juntos de forma mais concreta.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.collectiveLevel2,
    currency: "BRL",
    sessionsIncluded: 8,
    durationDays: 60,
    target: "Squads com base consolidada e necessidade de evoluir em consistência e pressão.",
    active: true,
    sortOrder: 6,
    features: [
      "Análise de funcionamento do time",
      "Ajustes de papel e comunicação",
      "Foco em pressão e tomada de decisão em equipe",
      "Estratégia para evoluir como grupo",
    ],
    cta: "Solicitar nível 2",
  },
  {
    id: "plan-collective-3",
    slug: "mentoria-coletiva-nivel-3",
    name: "Mentoria Coletiva — Nível 3",
    productType: "mentoring",
    modality: "collective",
    tier: 3,
    shortDescription: "Estrutura premium para time que busca performance coletiva maior.",
    description:
      "Ciclo avançado para squads que querem otimizar a dinâmica de jogo e a consistência competitiva. O plano é pensado para times que já têm entendimento do jogo e buscam transformar a equipe em uma máquina mais eficiente.",
    price: null,
    priceLabel: MENTORSHIP_COMMERCIAL_CONFIG.planReference.collectiveLevel3,
    currency: "BRL",
    sessionsIncluded: 12,
    durationDays: 90,
    target: "Times competitivos que querem elevar o nível de sinergia e execução em partidas decisivas.",
    active: true,
    sortOrder: 7,
    features: [
      "Melhoria de estratégia coletiva",
      "Análise de padrão e execução em alta pressão",
      "Planejamento de evolução do squad",
      "Acompanhamento de crescimento coletivo",
    ],
    cta: "Solicitar nível 3",
  },
];

export function getMentorshipProductBySlug(slug: string) {
  return MENTORSHIP_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function isAuthenticatedRedirectRequired() {
  return false;
}
