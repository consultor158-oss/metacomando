// Engine de recomendações automáticas baseado em métricas reais Meta Ads
// Combina dados da camada de "campanhas com conversão" (campConv) + budget atual

export type Severity = "critical" | "warning" | "opportunity" | "info";
export type ActionType =
  | "PAUSE"
  | "DECREASE_BUDGET"
  | "INCREASE_BUDGET"
  | "CHANGE_AUDIENCE"
  | "CHANGE_CREATIVE"
  | "FIX_LANDING_PAGE"
  | "DUPLICATE_WINNER";

export interface Recommendation {
  id: string;
  campaignId: string;
  campaignName: string;
  severity: Severity;
  action: ActionType;
  title: string;
  reason: string;
  metric: string;
  // sugestão de novo budget (em centavos) quando aplicável
  suggestedDailyBudgetCents?: number;
  // budget atual em centavos (se conhecido)
  currentDailyBudgetCents?: number;
}

interface CampConvRow {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  ctr: number;
  cpc: number;
  landing_page_views: number;
  add_to_cart: number;
  initiate_checkout: number;
  purchases: number;
  revenue: number;
  roas: number;
  cpa: number;
  cvr_click_to_purchase: number;
  cvr_lpv_to_purchase: number;
  drop_click_to_lpv: number;
  drop_atc_to_purchase: number;
}

interface CampaignMeta {
  id: string;
  daily_budget?: string | number | null;
  effective_status?: string;
  status?: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  info: 3,
};

export function generateRecommendations(
  campConv: CampConvRow[],
  campaigns: CampaignMeta[],
  opts: { roasTarget?: number; cpaTarget?: number; minSpendForJudgement?: number } = {},
): Recommendation[] {
  const roasTarget = opts.roasTarget ?? 2;
  const cpaTarget = opts.cpaTarget ?? 10;
  const minSpend = opts.minSpendForJudgement ?? 20;

  const byId = new Map(campaigns.map((c) => [c.id, c]));
  const recs: Recommendation[] = [];

  for (const c of campConv) {
    const meta = byId.get(c.campaign_id);
    const isActive = (meta?.effective_status || meta?.status) === "ACTIVE";
    if (!isActive) continue;

    const dailyBudgetCents = meta?.daily_budget ? parseInt(String(meta.daily_budget)) : 0;

    // 1) PAUSAR — gastou e não vendeu nada
    if (c.spend >= minSpend && c.purchases === 0) {
      recs.push({
        id: `${c.campaign_id}-pause-nopurchase`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "critical",
        action: "PAUSE",
        title: "Pausar — sem conversões",
        reason: `Já gastou ${fmt(c.spend)} e nenhuma compra. Pausar para não queimar verba.`,
        metric: `${c.purchases} compras / ${fmt(c.spend)}`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
      continue;
    }

    // 2) PAUSAR — ROAS muito baixo com gasto significativo
    if (c.spend >= minSpend * 2 && c.roas > 0 && c.roas < 1) {
      recs.push({
        id: `${c.campaign_id}-pause-roas`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "critical",
        action: "PAUSE",
        title: "Pausar — ROAS abaixo de 1x (prejuízo)",
        reason: `ROAS ${c.roas.toFixed(2)}x significa cada R$1 gasto traz menos de R$1 de receita.`,
        metric: `ROAS ${c.roas.toFixed(2)}x · gasto ${fmt(c.spend)}`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
      continue;
    }

    // 3) REDUZIR BUDGET — ROAS abaixo do alvo mas ainda lucrativo
    if (c.spend >= minSpend && c.roas >= 1 && c.roas < roasTarget) {
      const newBudget = Math.max(500, Math.round(dailyBudgetCents * 0.7));
      recs.push({
        id: `${c.campaign_id}-decrease`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "warning",
        action: "DECREASE_BUDGET",
        title: "Reduzir budget em 30%",
        reason: `ROAS ${c.roas.toFixed(2)}x abaixo do alvo (${roasTarget}x). Reduzir gasto para preservar margem.`,
        metric: `ROAS ${c.roas.toFixed(2)}x · CPA ${fmt(c.cpa)}`,
        currentDailyBudgetCents: dailyBudgetCents,
        suggestedDailyBudgetCents: dailyBudgetCents > 0 ? newBudget : undefined,
      });
    }

    // 4) AUMENTAR BUDGET — ROAS bom, escalar
    if (c.spend >= minSpend && c.roas >= roasTarget && c.purchases >= 2) {
      const factor = c.roas >= roasTarget * 2 ? 1.5 : 1.2;
      const newBudget = Math.round(dailyBudgetCents * factor);
      recs.push({
        id: `${c.campaign_id}-scale`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "opportunity",
        action: "INCREASE_BUDGET",
        title: `Escalar budget +${Math.round((factor - 1) * 100)}%`,
        reason: `ROAS ${c.roas.toFixed(2)}x acima do alvo. Aumentar budget gradualmente para escalar vendas.`,
        metric: `ROAS ${c.roas.toFixed(2)}x · ${c.purchases} compras`,
        currentDailyBudgetCents: dailyBudgetCents,
        suggestedDailyBudgetCents: dailyBudgetCents > 0 ? newBudget : undefined,
      });
    }

    // 5) DUPLICAR VENCEDORA — ROAS muito alto
    if (c.roas >= roasTarget * 2 && c.purchases >= 3) {
      recs.push({
        id: `${c.campaign_id}-duplicate`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "opportunity",
        action: "DUPLICATE_WINNER",
        title: "Duplicar como modelo vencedor",
        reason: `ROAS excepcional (${c.roas.toFixed(2)}x). Clone com novo público para multiplicar resultado.`,
        metric: `ROAS ${c.roas.toFixed(2)}x · ${c.purchases} compras`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
    }

    // 6) CONSERTAR LANDING PAGE — perde muito do clique para o LPV (bounce alto)
    if (c.link_clicks >= 50 && c.drop_click_to_lpv >= 50) {
      recs.push({
        id: `${c.campaign_id}-landing`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "warning",
        action: "FIX_LANDING_PAGE",
        title: "Consertar landing page (bounce alto)",
        reason: `${c.drop_click_to_lpv.toFixed(0)}% dos cliques NÃO chegam à landing page. Verifique velocidade, link quebrado ou pixel.`,
        metric: `${c.link_clicks} cliques → ${c.landing_page_views} LPV`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
    }

    // 7) TROCAR PÚBLICO — CTR muito baixo (criativo/segmentação não engaja)
    if (c.impressions >= 5000 && c.ctr > 0 && c.ctr < 0.5) {
      recs.push({
        id: `${c.campaign_id}-audience`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "warning",
        action: "CHANGE_AUDIENCE",
        title: "Trocar público / criativo",
        reason: `CTR ${c.ctr.toFixed(2)}% (alvo ≥ 1%). Público não está reagindo — testar nova segmentação ou criativo.`,
        metric: `CTR ${c.ctr.toFixed(2)}% · ${c.impressions} impressões`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
    }

    // 8) CHECKOUT ABANDONADO — gente coloca no carrinho mas não compra
    if (c.add_to_cart >= 10 && c.drop_atc_to_purchase >= 80) {
      recs.push({
        id: `${c.campaign_id}-checkout`,
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        severity: "warning",
        action: "CHANGE_CREATIVE",
        title: "Otimizar checkout / oferta",
        reason: `${c.drop_atc_to_purchase.toFixed(0)}% abandonam após carrinho. Revise frete, preço, formas de pagamento.`,
        metric: `${c.add_to_cart} ATC → ${c.purchases} compras`,
        currentDailyBudgetCents: dailyBudgetCents,
      });
    }
  }

  return recs.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.campaignName.localeCompare(b.campaignName),
  );
}

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const ACTION_LABELS: Record<ActionType, { emoji: string; label: string; color: string }> = {
  PAUSE: { emoji: "⏸️", label: "Pausar agora", color: "bg-destructive/20 text-destructive hover:bg-destructive/30" },
  DECREASE_BUDGET: { emoji: "📉", label: "Reduzir budget", color: "bg-[oklch(0.77_0.19_70/0.2)] text-[oklch(0.77_0.19_70)] hover:bg-[oklch(0.77_0.19_70/0.3)]" },
  INCREASE_BUDGET: { emoji: "📈", label: "Aumentar budget", color: "bg-[oklch(0.7_0.18_162/0.2)] text-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.7_0.18_162/0.3)]" },
  CHANGE_AUDIENCE: { emoji: "🎯", label: "Trocar público", color: "bg-primary/20 text-primary hover:bg-primary/30" },
  CHANGE_CREATIVE: { emoji: "🎨", label: "Novo criativo", color: "bg-primary/20 text-primary hover:bg-primary/30" },
  FIX_LANDING_PAGE: { emoji: "🔧", label: "Conferir página", color: "bg-primary/20 text-primary hover:bg-primary/30" },
  DUPLICATE_WINNER: { emoji: "🚀", label: "Duplicar vencedor", color: "bg-[oklch(0.7_0.18_162/0.2)] text-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.7_0.18_162/0.3)]" },
};

export const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-l-4 border-destructive bg-destructive/5",
  warning: "border-l-4 border-[oklch(0.77_0.19_70)] bg-[oklch(0.77_0.19_70/0.05)]",
  opportunity: "border-l-4 border-[oklch(0.7_0.18_162)] bg-[oklch(0.7_0.18_162/0.05)]",
  info: "border-l-4 border-primary bg-primary/5",
};
