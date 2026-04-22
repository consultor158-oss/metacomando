import { createServerFn } from "@tanstack/react-start";

const GRAPH_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getCreds() {
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");
  if (!account) throw new Error("META_AD_ACCOUNT_ID não configurado");
  // Normalize account id to act_XXX
  const actId = account.startsWith("act_") ? account : `act_${account}`;
  return { token, actId };
}

async function metaFetch(path: string, params: Record<string, string> = {}, init?: RequestInit) {
  const { token } = getCreds();
  const url = new URL(`${BASE}/${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), init);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok || data?.error) {
    const err = data?.error || {};
    const e: any = new Error(err.message || `Meta API ${res.status}`);
    e.code = err.code;
    e.subcode = err.error_subcode;
    e.type = err.type;
    e.fbtrace_id = err.fbtrace_id;
    e.status = res.status;
    e.is_token_expired = err.code === 190;
    throw e;
  }
  return data;
}

function errorPayload(e: any) {
  return {
    ok: false as const,
    error: e?.message || "Erro desconhecido",
    code: e?.code,
    subcode: e?.subcode,
    type: e?.type,
    is_token_expired: !!e?.is_token_expired,
    fbtrace_id: e?.fbtrace_id,
  };
}

// ==================== INSIGHTS (overview KPIs) ====================
export const getAccountInsights = createServerFn({ method: "GET" })
  .inputValidator((d: { datePreset?: string }) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const datePreset = data.datePreset || "last_7d";
      const insights = await metaFetch(`${actId}/insights`, {
        date_preset: datePreset,
        fields:
          "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas",
        time_increment: "1",
        level: "account",
      });
      return { ok: true as const, data: insights.data ?? [] };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== CAMPAIGNS LIST ====================
export const getCampaigns = createServerFn({ method: "GET" })
  .inputValidator((d: { onlyActive?: boolean; datePreset?: string }) => d ?? {})
  .handler(async ({ data }) => {
  try {
    const { actId } = getCreds();
    const datePreset = data.datePreset || "last_7d";
    const params: Record<string, string> = {
      fields:
        "id,name,status,effective_status,objective,daily_budget,lifetime_budget,buying_type,bid_strategy,created_time,updated_time",
      limit: "200",
    };
    if (data.onlyActive) params.effective_status = JSON.stringify(["ACTIVE"]);
    const camps = await metaFetch(`${actId}/campaigns`, params);
    const ids = (camps.data ?? []).map((c: any) => c.id);

    // Fetch insights per campaign in batch
    let insightsMap: Record<string, any> = {};
    if (ids.length) {
      const ins = await metaFetch(`${actId}/insights`, {
        level: "campaign",
        date_preset: datePreset,
        fields: "campaign_id,spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas",
        limit: "500",
      });
      for (const row of ins.data ?? []) {
        insightsMap[row.campaign_id] = row;
      }
    }

    const enriched = (camps.data ?? []).map((c: any) => {
      const i = insightsMap[c.id] ?? {};
      const purchases =
        (i.actions ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
      const purchaseValue =
        (i.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
      const roas = i.purchase_roas?.[0]?.value || "0";
      const spend = parseFloat(i.spend || "0");
      const conv = parseFloat(purchases);
      const cpa = conv > 0 ? spend / conv : 0;
      return {
        ...c,
        spend,
        impressions: parseInt(i.impressions || "0"),
        clicks: parseInt(i.clicks || "0"),
        ctr: parseFloat(i.ctr || "0"),
        cpc: parseFloat(i.cpc || "0"),
        conversions: conv,
        revenue: parseFloat(purchaseValue),
        roas: parseFloat(roas),
        cpa,
      };
    });

    return { ok: true as const, data: enriched };
  } catch (e) {
    return { ...errorPayload(e), data: [] as any[] };
  }
});

// ==================== UPDATE CAMPAIGN STATUS ====================
export const updateCampaignStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { campaignId: string; status: "ACTIVE" | "PAUSED" }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await metaFetch(
        data.campaignId,
        {},
        {
          method: "POST",
          body: new URLSearchParams({
            status: data.status,
            access_token: process.env.META_ACCESS_TOKEN!,
          }),
        },
      );
      return { ok: true, data: result };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== UPDATE BUDGET ====================
export const updateBudget = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; dailyBudgetCents: number; type: "campaign" | "adset" }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await metaFetch(
        data.id,
        {},
        {
          method: "POST",
          body: new URLSearchParams({
            daily_budget: String(data.dailyBudgetCents),
            access_token: process.env.META_ACCESS_TOKEN!,
          }),
        },
      );
      return { ok: true, data: result };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== CREATE CAMPAIGN (used by scale strategies) ====================
export const createCampaign = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      name: string;
      objective: string;
      buyingType?: string;
      status?: "ACTIVE" | "PAUSED";
      dailyBudgetCents?: number;
      strategy?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const { actId, token } = getCreds();
      const body = new URLSearchParams({
        name: data.name,
        objective: data.objective || "OUTCOME_SALES",
        buying_type: data.buyingType || "AUCTION",
        status: data.status || "PAUSED",
        special_ad_categories: JSON.stringify([]),
        access_token: token,
      });
      if (data.dailyBudgetCents) {
        body.set("daily_budget", String(data.dailyBudgetCents));
      }
      const result = await metaFetch(`${actId}/campaigns`, {}, { method: "POST", body });
      return { ok: true, data: result, strategy: data.strategy };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== DUPLICATE CAMPAIGN (clone existing as template) ====================
// Lê uma campanha existente e cria uma nova idêntica (objetivo, buying_type, budget, bid_strategy)
// Opcionalmente sobrescreve nome/budget/status.
export const duplicateCampaign = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      sourceCampaignId: string;
      newName?: string;
      dailyBudgetCents?: number;
      status?: "ACTIVE" | "PAUSED";
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const { actId, token } = getCreds();
      // 1) lê a campanha origem
      const src = await metaFetch(data.sourceCampaignId, {
        fields:
          "name,objective,buying_type,bid_strategy,daily_budget,lifetime_budget,special_ad_categories,status",
      });

      const finalName =
        data.newName ||
        `${src.name} — cópia ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

      const body = new URLSearchParams({
        name: finalName,
        objective: src.objective || "OUTCOME_SALES",
        buying_type: src.buying_type || "AUCTION",
        status: data.status || "PAUSED",
        special_ad_categories: JSON.stringify(src.special_ad_categories || []),
        access_token: token,
      });

      // budget: usa o sobrescrito; senão herda da origem
      const budgetCents =
        data.dailyBudgetCents ?? (src.daily_budget ? parseInt(src.daily_budget) : 0);
      if (budgetCents > 0) body.set("daily_budget", String(budgetCents));

      if (src.bid_strategy) body.set("bid_strategy", src.bid_strategy);

      const result = await metaFetch(`${actId}/campaigns`, {}, { method: "POST", body });
      return {
        ok: true,
        data: result,
        clonedFrom: { id: data.sourceCampaignId, name: src.name },
        appliedTemplate: {
          objective: src.objective,
          buying_type: src.buying_type,
          bid_strategy: src.bid_strategy,
          daily_budget: budgetCents,
        },
      };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== ADSETS LIST ====================
export const getAdSets = createServerFn({ method: "GET" })
  .inputValidator((d: { campaignId?: string }) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const path = data.campaignId ? `${data.campaignId}/adsets` : `${actId}/adsets`;
      const res = await metaFetch(path, {
        fields: "id,name,status,daily_budget,lifetime_budget,targeting,optimization_goal",
        limit: "100",
      });
      return { ok: true, data: res.data ?? [] };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== AI COPY GENERATION ====================
export const generateAdCopy = createServerFn({ method: "POST" })
  .inputValidator((d: { briefing: string; tone?: string; product?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("LOVABLE_API_KEY não configurado");

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Você é um copywriter de tráfego pago Meta Ads. Gere copies em PT-BR persuasivas, curtas, com gancho forte.",
            },
            {
              role: "user",
              content: `Gere 3 variações de copy para Meta Ads. Briefing: ${data.briefing}. Produto: ${data.product || "não informado"}. Tom: ${data.tone || "direto"}. Formato JSON: {"variations":[{"headline":"...","primary":"...","description":"...","cta":"..."}]}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        if (res.status === 429) return { ok: false, error: "Limite de uso da IA atingido" };
        if (res.status === 402) return { ok: false, error: "Créditos da IA esgotados" };
        return { ok: false, error: `IA error ${res.status}: ${t}` };
      }
      const j = await res.json();
      const content = j.choices?.[0]?.message?.content || "";
      // Try to extract JSON
      let parsed: any = null;
      try {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      } catch {}
      return { ok: true, raw: content, parsed };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== CONVERSION FUNNEL (account-level) ====================
// Puxa o funil completo de conversão: impressões -> link click -> LPV -> ATC -> Checkout -> Purchase
const FUNNEL_ACTIONS = [
  "link_click",
  "landing_page_view",
  "add_to_cart",
  "initiate_checkout",
  "add_payment_info",
  "purchase",
  "lead",
  "complete_registration",
  "view_content",
];

function pickAction(actions: any[], type: string): number {
  const a = (actions ?? []).find((x: any) => x.action_type === type);
  return a ? parseFloat(a.value || "0") : 0;
}
function pickActionValue(values: any[], type: string): number {
  const a = (values ?? []).find((x: any) => x.action_type === type);
  return a ? parseFloat(a.value || "0") : 0;
}

export const getConversionFunnel = createServerFn({ method: "GET" })
  .inputValidator((d: { datePreset?: string }) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const datePreset = data.datePreset || "last_7d";
      const res = await metaFetch(`${actId}/insights`, {
        date_preset: datePreset,
        level: "account",
        fields:
          "spend,impressions,clicks,inline_link_clicks,unique_clicks,unique_inline_link_clicks,actions,action_values,cost_per_action_type,cost_per_unique_click",
      });
      const row = (res.data ?? [])[0] || {};
      const actions = row.actions ?? [];
      const values = row.action_values ?? [];
      const cpa = row.cost_per_action_type ?? [];

      const funnel = {
        impressions: parseInt(row.impressions || "0"),
        clicks_all: parseInt(row.clicks || "0"),
        link_clicks: parseInt(row.inline_link_clicks || pickAction(actions, "link_click").toString()),
        landing_page_views: pickAction(actions, "landing_page_view"),
        view_content: pickAction(actions, "view_content"),
        add_to_cart: pickAction(actions, "add_to_cart"),
        initiate_checkout: pickAction(actions, "initiate_checkout"),
        add_payment_info: pickAction(actions, "add_payment_info"),
        purchases: pickAction(actions, "purchase"),
        leads: pickAction(actions, "lead"),
        registrations: pickAction(actions, "complete_registration"),
        revenue: pickActionValue(values, "purchase"),
        spend: parseFloat(row.spend || "0"),
        cost_per_link_click: pickActionValue(cpa, "link_click"),
        cost_per_lpv: pickActionValue(cpa, "landing_page_view"),
        cost_per_atc: pickActionValue(cpa, "add_to_cart"),
        cost_per_checkout: pickActionValue(cpa, "initiate_checkout"),
        cost_per_purchase: pickActionValue(cpa, "purchase"),
      };
      return { ok: true as const, data: funnel };
    } catch (e) {
      return { ...errorPayload(e), data: null as any };
    }
  });

// ==================== PLACEMENT / DESTINATION BREAKDOWN ====================
// "Para onde foi o clique" — breakdown por placement, device e action_destination
export const getClickBreakdown = createServerFn({ method: "GET" })
  .inputValidator((d: { datePreset?: string; breakdown?: string }) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const datePreset = data.datePreset || "last_7d";
      const breakdown = data.breakdown || "publisher_platform,platform_position,impression_device";
      const res = await metaFetch(`${actId}/insights`, {
        date_preset: datePreset,
        level: "account",
        breakdowns: breakdown,
        fields:
          "spend,impressions,clicks,inline_link_clicks,ctr,cpc,actions,action_values",
        limit: "200",
      });
      const rows = (res.data ?? []).map((r: any) => {
        const linkClicks = parseInt(r.inline_link_clicks || "0");
        const purchases = pickAction(r.actions, "purchase");
        const revenue = pickActionValue(r.action_values, "purchase");
        const spend = parseFloat(r.spend || "0");
        return {
          publisher_platform: r.publisher_platform || "—",
          platform_position: r.platform_position || "—",
          impression_device: r.impression_device || "—",
          impressions: parseInt(r.impressions || "0"),
          clicks: parseInt(r.clicks || "0"),
          link_clicks: linkClicks,
          ctr: parseFloat(r.ctr || "0"),
          cpc: parseFloat(r.cpc || "0"),
          spend,
          purchases,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          cvr: linkClicks > 0 ? (purchases / linkClicks) * 100 : 0,
        };
      });
      return { ok: true as const, data: rows };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== CAMPAIGN-LEVEL CONVERSION DETAILS ====================
// Detalha por campanha: link clicks, LPV, ATC, Checkout, Purchase, CVR — para "ver se realmente vende"
export const getCampaignsConversion = createServerFn({ method: "GET" })
  .inputValidator((d: { datePreset?: string; onlyActive?: boolean }) => d ?? {})
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const datePreset = data.datePreset || "last_7d";
      const params: Record<string, string> = {
        level: "campaign",
        date_preset: datePreset,
        fields:
          "campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks,ctr,cpc,actions,action_values,cost_per_action_type",
        limit: "500",
      };
      if (data.onlyActive) params.filtering = JSON.stringify([{ field: "campaign.effective_status", operator: "IN", value: ["ACTIVE"] }]);
      const res = await metaFetch(`${actId}/insights`, params);
      const rows = (res.data ?? []).map((r: any) => {
        const spend = parseFloat(r.spend || "0");
        const linkClicks = parseInt(r.inline_link_clicks || "0");
        const lpv = pickAction(r.actions, "landing_page_view");
        const atc = pickAction(r.actions, "add_to_cart");
        const ic = pickAction(r.actions, "initiate_checkout");
        const purchases = pickAction(r.actions, "purchase");
        const revenue = pickActionValue(r.action_values, "purchase");
        return {
          campaign_id: r.campaign_id,
          campaign_name: r.campaign_name,
          spend,
          impressions: parseInt(r.impressions || "0"),
          clicks: parseInt(r.clicks || "0"),
          link_clicks: linkClicks,
          ctr: parseFloat(r.ctr || "0"),
          cpc: parseFloat(r.cpc || "0"),
          landing_page_views: lpv,
          add_to_cart: atc,
          initiate_checkout: ic,
          purchases,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          cpa: purchases > 0 ? spend / purchases : 0,
          cvr_click_to_purchase: linkClicks > 0 ? (purchases / linkClicks) * 100 : 0,
          cvr_lpv_to_purchase: lpv > 0 ? (purchases / lpv) * 100 : 0,
          drop_click_to_lpv: linkClicks > 0 ? ((linkClicks - lpv) / linkClicks) * 100 : 0,
          drop_atc_to_purchase: atc > 0 ? ((atc - purchases) / atc) * 100 : 0,
          really_sells: purchases > 0 && revenue > spend, // verdade do "vende"
        };
      });
      return { ok: true as const, data: rows };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== ACCOUNT INFO ====================
export const getAccountInfo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { actId } = getCreds();
    const info = await metaFetch(actId, {
      fields: "id,name,currency,account_status,timezone_name,amount_spent,balance",
    });
    return { ok: true, data: info };
  } catch (e) {
    return errorPayload(e);
  }
});
