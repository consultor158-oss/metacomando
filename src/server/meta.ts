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
