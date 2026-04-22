export type ScaleStrategy = {
  id: string;
  name: string;
  emoji: string;
  shortDesc: string;
  fullDesc: string;
  defaults: {
    objective: string;
    dailyBudgetCents: number;
    namePrefix: string;
    status: "ACTIVE" | "PAUSED";
  };
  color: string;
};

export const SCALE_STRATEGIES: ScaleStrategy[] = [
  {
    id: "abo",
    name: "ABO",
    emoji: "🎯",
    shortDesc: "Orçamento por adset manual. Granular, ideal para testes; +20-30%/dia em winners.",
    fullDesc:
      "Adset Budget Optimization: você define o orçamento de cada adset manualmente. Ideal para testes A/B granulares de público/criativo. Quando um adset prova ROI ≥ 2, escale +20–30%/dia.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 5000, namePrefix: "ABO", status: "ACTIVE" },
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "cbo",
    name: "CBO",
    emoji: "🤖",
    shortDesc: "IA aloca verba na campanha. Escala até 10x; +20% a cada 3 dias após 50 conv.",
    fullDesc:
      "Campaign Budget Optimization: a IA do Meta distribui o orçamento entre adsets. Use quando já houver pelo menos 50 conversões. Escale +20% a cada 3 dias mantendo ROAS alto.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 15000, namePrefix: "CBO", status: "ACTIVE" },
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "111",
    name: "1-1-1",
    emoji: "🥚",
    shortDesc: "1 campanha / 1 adset / 1 anúncio. Cold start; duplique winners.",
    fullDesc:
      "Estrutura mínima para validar criativo. Ideal para cold start de novas contas/produtos. Quando o anúncio bater meta, duplique e teste variações.",
    defaults: { objective: "OUTCOME_ENGAGEMENT", dailyBudgetCents: 2000, namePrefix: "111", status: "ACTIVE" },
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "baiana",
    name: "Escala Baiana",
    emoji: "🔥",
    shortDesc: "50 criativos a R$7/set (ROI≥2); escale 250 sets R$1750–2500/dia.",
    fullDesc:
      "Estratégia de volume: subir 50 criativos a R$7/adset; manter os que ROI ≥ 2 e replicar até 250 adsets, atingindo R$1.750–2.500/dia. +200 adsets em 5 minutos via API.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 700, namePrefix: "BAIANA", status: "PAUSED" },
    color: "from-orange-500 to-red-500",
  },
  {
    id: "russa",
    name: "Escala Russa",
    emoji: "❄️",
    shortDesc: "+20-30%/dia conservador; públicos narrow, ABO em CBO.",
    fullDesc:
      "Escala lenta e segura: +20–30% por dia mantendo o ROAS estável. Combine públicos narrow dentro de CBO ou use ABO. Boa para contas recém-recuperadas.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 10000, namePrefix: "RUSSA", status: "ACTIVE" },
    color: "from-sky-500 to-indigo-500",
  },
  {
    id: "vertical",
    name: "Vertical",
    emoji: "📈",
    shortDesc: "+20-30%/dia (regra 20%), CBO, ROAS estável 7 dias.",
    fullDesc:
      "Aumenta orçamento da mesma campanha em incrementos de 20–30%/dia. Use somente quando ROAS estiver estável por 7 dias. Funciona melhor em CBO.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 20000, namePrefix: "VERT", status: "ACTIVE" },
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "horizontal",
    name: "Horizontal",
    emoji: "↔️",
    shortDesc: "Adicionar adsets/criativos; diagonal para volume.",
    fullDesc:
      "Em vez de aumentar verba, replique adsets winners para novos públicos/criativos. Aumenta volume sem instabilizar o aprendizado.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 5000, namePrefix: "HORIZ", status: "ACTIVE" },
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "bitcamp",
    name: "Bitcamp",
    emoji: "⚡",
    shortDesc: "24h agressivo R$200–500 amplos; kill losers.",
    fullDesc:
      "Estratégia de teste agressiva por 24h: orçamentos R$200–500 com públicos amplos. Avalia rápido; pausa losers no dia seguinte.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 30000, namePrefix: "BITCAMP", status: "ACTIVE" },
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "andromeda",
    name: "Andrômeda",
    emoji: "🌌",
    shortDesc: "+20%/3-4 dias; ROAS>2.5x freq<3; otimização de públicos.",
    fullDesc:
      "Escala matemática: aumentar +20% a cada 3–4 dias se ROAS > 2.5x e frequência < 3. Combina otimização de públicos lookalike e exclusões.",
    defaults: { objective: "OUTCOME_SALES", dailyBudgetCents: 25000, namePrefix: "ANDRO", status: "ACTIVE" },
    color: "from-violet-500 to-fuchsia-500",
  },
];
