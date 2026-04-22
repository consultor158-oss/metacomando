// Estimativa de impacto antes de aplicar uma recomendação.
// Usa heurísticas simples baseadas no histórico recente da campanha.

import type { Recommendation } from "./recommendations";

export interface CampConvLite {
  campaign_id: string;
  spend: number;
  purchases: number;
  revenue: number;
  roas: number;
  cpa: number;
  link_clicks: number;
  cvr_click_to_purchase: number;
}

export interface ImpactEstimate {
  // valores atuais
  currentDailySpend: number;
  currentRoas: number;
  currentCvr: number; // %
  currentDailyRevenue: number;
  currentDailyPurchases: number;

  // projeção pós-aplicação
  projectedDailySpend: number;
  projectedRoas: number;
  projectedCvr: number;
  projectedDailyRevenue: number;
  projectedDailyPurchases: number;

  // diffs
  spendDelta: number; // R$/dia
  revenueDelta: number; // R$/dia
  roasDelta: number;
  cvrDelta: number;

  confidence: "alta" | "média" | "baixa";
  notes: string[];
}

/**
 * Estima impacto diário de uma recomendação.
 * Premissas:
 *  - Janela analisada = últimos 7 dias (ou o que vier em campConv).
 *  - Mudança de budget escala spend e (com retorno marginal decrescente) compras.
 *  - PAUSE zera tudo.
 *  - Outras ações (AUDIENCE, CREATIVE, LANDING) usam multiplicadores conservadores.
 */
export function estimateImpact(
  rec: Recommendation,
  campConv: CampConvLite[],
  windowDays = 7,
): ImpactEstimate {
  const c = campConv.find((x) => x.campaign_id === rec.campaignId);
  const days = Math.max(1, windowDays);

  const dailySpend = c ? c.spend / days : 0;
  const dailyRevenue = c ? c.revenue / days : 0;
  const dailyPurchases = c ? c.purchases / days : 0;
  const roas = c?.roas ?? 0;
  const cvr = c?.cvr_click_to_purchase ?? 0;

  let projSpend = dailySpend;
  let projRevenue = dailyRevenue;
  let projPurchases = dailyPurchases;
  let projRoas = roas;
  let projCvr = cvr;
  let confidence: ImpactEstimate["confidence"] = "média";
  const notes: string[] = [];

  switch (rec.action) {
    case "PAUSE":
      projSpend = 0;
      projRevenue = 0;
      projPurchases = 0;
      projRoas = 0;
      projCvr = 0;
      confidence = "alta";
      notes.push(`Economia imediata de ${fmtBRL(dailySpend)}/dia em gasto.`);
      if (dailyRevenue > 0)
        notes.push(`Você abre mão de ~${fmtBRL(dailyRevenue)}/dia de receita.`);
      break;

    case "INCREASE_BUDGET":
    case "DECREASE_BUDGET": {
      const cur = rec.currentDailyBudgetCents ?? 0;
      const next = rec.suggestedDailyBudgetCents ?? cur;
      if (cur > 0 && next > 0) {
        const factor = next / cur;
        projSpend = dailySpend * factor;
        // retorno marginal decrescente em escalas, e ganho proporcional em redução
        const revFactor =
          factor > 1 ? 1 + (factor - 1) * 0.7 : factor; // escala 70% eficiente
        projRevenue = dailyRevenue * revFactor;
        projPurchases = dailyPurchases * revFactor;
        projRoas = projSpend > 0 ? projRevenue / projSpend : 0;
        projCvr = cvr; // CVR tende a se manter
        confidence = factor > 1.3 ? "baixa" : "média";
        notes.push(
          factor > 1
            ? `Aumento de budget em +${Math.round((factor - 1) * 100)}%. Receita escala ~70% do aumento (saturação).`
            : `Redução de budget em ${Math.round((1 - factor) * 100)}%. Gasto e receita caem proporcionalmente.`,
        );
      } else {
        notes.push("Budget atual desconhecido (provável CBO no adset).");
        confidence = "baixa";
      }
      break;
    }

    case "DUPLICATE_WINNER":
      // Duplicata herda budget atual e ~80% do desempenho original
      projSpend = dailySpend * 1.8;
      projRevenue = dailyRevenue * 1.8 * 0.8; // novo público costuma render menos
      projPurchases = dailyPurchases * 1.8 * 0.8;
      projRoas = projSpend > 0 ? projRevenue / projSpend : 0;
      projCvr = cvr * 0.85;
      confidence = "baixa";
      notes.push("Duplicata vai concorrer leilão consigo mesma; ROAS pode cair 10–20%.");
      notes.push("Novo público entra em fase de aprendizado por 3–5 dias.");
      break;

    case "FIX_LANDING_PAGE":
      // Se conserto reduzir bounce em ~30%, CVR sobe equivalente
      projCvr = cvr * 1.3;
      projPurchases = dailyPurchases * 1.3;
      projRevenue = dailyRevenue * 1.3;
      projRoas = projSpend > 0 ? projRevenue / projSpend : 0;
      confidence = "baixa";
      notes.push("Premissa: conserto reduz bounce em 30% (precisa testar).");
      break;

    case "CHANGE_AUDIENCE":
    case "CHANGE_CREATIVE":
      // Estimativa otimista: +20% CTR/CVR
      projCvr = cvr * 1.2;
      projPurchases = dailyPurchases * 1.2;
      projRevenue = dailyRevenue * 1.2;
      projRoas = projSpend > 0 ? projRevenue / projSpend : 0;
      confidence = "baixa";
      notes.push("Premissa: novo público/criativo gera +20% conversão.");
      notes.push("Resultado real depende de teste A/B real.");
      break;
  }

  if (!c) {
    notes.push("⚠️ Sem dados históricos — projeção apenas teórica.");
    confidence = "baixa";
  }

  return {
    currentDailySpend: dailySpend,
    currentRoas: roas,
    currentCvr: cvr,
    currentDailyRevenue: dailyRevenue,
    currentDailyPurchases: dailyPurchases,
    projectedDailySpend: projSpend,
    projectedRoas: projRoas,
    projectedCvr: projCvr,
    projectedDailyRevenue: projRevenue,
    projectedDailyPurchases: projPurchases,
    spendDelta: projSpend - dailySpend,
    revenueDelta: projRevenue - dailyRevenue,
    roasDelta: projRoas - roas,
    cvrDelta: projCvr - cvr,
    confidence,
    notes,
  };
}

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
