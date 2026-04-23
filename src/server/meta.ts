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

// ==================== EDIT HELPERS ====================
async function metaPost(path: string, body: Record<string, string>) {
  const { token } = getCreds();
  const url = new URL(`${BASE}/${path}`);
  const form = new URLSearchParams();
  form.set("access_token", token);
  for (const [k, v] of Object.entries(body)) form.set(k, v);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-form-urlencoded" },
    body: form.toString(),
  });
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
    throw e;
  }
  return data;
}

// ==================== UPDATE CAMPAIGN STATUS ====================
export const updateCampaignStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { campaignId: string; status: "ACTIVE" | "PAUSED" }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await metaPost(data.campaignId, { status: data.status });
      return { ok: true as const, data: result };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== UPDATE BUDGET ====================
export const updateBudget = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; dailyBudgetCents: number; type: "campaign" | "adset" }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await metaPost(data.id, { daily_budget: String(data.dailyBudgetCents) });
      return { ok: true as const, data: result };
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
      const { actId } = getCreds();
      const body: Record<string, string> = {
        name: data.name,
        objective: data.objective || "OUTCOME_SALES",
        buying_type: data.buyingType || "AUCTION",
        status: data.status || "PAUSED",
        special_ad_categories: JSON.stringify([]),
      };
      if (data.dailyBudgetCents) {
        body.daily_budget = String(data.dailyBudgetCents);
      }
      const result = await metaPost(`${actId}/campaigns`, body);
      return { ok: true as const, data: result, strategy: data.strategy };
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

// ==================== CAMPAIGN DETAILS (adsets + ads + creatives + insights) ====================
export const getCampaignDetails = createServerFn({ method: "GET" })
  .inputValidator((d: { campaignId: string; datePreset?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const datePreset = data.datePreset || "last_7d";
      // Campaign with full fields
      const campaign = await metaFetch(data.campaignId, {
        fields:
          "id,name,status,effective_status,objective,daily_budget,lifetime_budget,buying_type,bid_strategy,special_ad_categories,created_time,updated_time,start_time,stop_time,configured_status",
      });

      // Adsets — paginate through all
      const adsets: any[] = [];
      {
        let next: string | null = null;
        let page = await metaFetch(`${data.campaignId}/adsets`, {
          fields:
            "id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,targeting,start_time,end_time,adset_spend_limit,lifetime_spend_cap",
          limit: "100",
        });
        adsets.push(...(page.data ?? []));
        next = page.paging?.next ?? null;
        let safety = 0;
        while (next && safety < 20) {
          const res = await fetch(next);
          page = await res.json();
          if (page?.data) adsets.push(...page.data);
          next = page?.paging?.next ?? null;
          safety++;
        }
      }

      // Ads + creatives — paginate through all (NOT just first page)
      const ads: any[] = [];
      {
        let next: string | null = null;
        let page = await metaFetch(`${data.campaignId}/ads`, {
          fields:
            "id,name,status,effective_status,adset_id,created_time,updated_time,creative{id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,video_id,call_to_action_type,instagram_permalink_url,effective_object_story_id,effective_instagram_media_id,object_type}",
          limit: "100",
        });
        ads.push(...(page.data ?? []));
        next = page.paging?.next ?? null;
        let safety = 0;
        while (next && safety < 30) {
          const res = await fetch(next);
          page = await res.json();
          if (page?.data) ads.push(...page.data);
          next = page?.paging?.next ?? null;
          safety++;
        }
      }

      // Resolve missing thumbnails via the ad's /previews endpoint (best effort)
      await Promise.all(
        ads.map(async (a: any) => {
          const cre = a.creative || {};
          const story = cre.object_story_spec || {};
          const link = story.link_data || story.video_data || {};
          const hasImg = cre.image_url || cre.thumbnail_url || link.picture;
          if (hasImg) return;
          try {
            const prev = await metaFetch(`${a.id}/previews`, {
              ad_format: "MOBILE_FEED_STANDARD",
            });
            const body: string = prev?.data?.[0]?.body || "";
            const m = body.match(/src=\\?"(https:[^"\\]+\.(?:jpg|jpeg|png|webp)[^"\\]*)/i);
            if (m) a._previewImage = m[1].replace(/&amp;/g, "&");
          } catch {}
        })
      );

      // Insights por campanha
      const camIns = await metaFetch(`${data.campaignId}/insights`, {
        date_preset: datePreset,
        fields:
          "spend,impressions,clicks,inline_link_clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas",
      });
      const ci = (camIns.data ?? [])[0] || {};
      const purchases = pickAction(ci.actions, "purchase");
      const revenue = pickActionValue(ci.action_values, "purchase");
      const spend = parseFloat(ci.spend || "0");
      const insights = {
        spend,
        impressions: parseInt(ci.impressions || "0"),
        clicks: parseInt(ci.clicks || "0"),
        link_clicks: parseInt(ci.inline_link_clicks || "0"),
        ctr: parseFloat(ci.ctr || "0"),
        cpc: parseFloat(ci.cpc || "0"),
        cpm: parseFloat(ci.cpm || "0"),
        reach: parseInt(ci.reach || "0"),
        frequency: parseFloat(ci.frequency || "0"),
        purchases,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: purchases > 0 ? spend / purchases : 0,
      };

      // Insights por ad (em batch via /insights level=ad)
      let adInsightsMap: Record<string, any> = {};
      try {
        const adIns = await metaFetch(`${data.campaignId}/insights`, {
          date_preset: datePreset,
          level: "ad",
          fields: "ad_id,spend,impressions,clicks,ctr,actions,action_values",
          limit: "500",
        });
        for (const r of adIns.data ?? []) {
          const p = pickAction(r.actions, "purchase");
          const v = pickActionValue(r.action_values, "purchase");
          const s = parseFloat(r.spend || "0");
          adInsightsMap[r.ad_id] = {
            spend: s,
            impressions: parseInt(r.impressions || "0"),
            clicks: parseInt(r.clicks || "0"),
            ctr: parseFloat(r.ctr || "0"),
            purchases: p,
            revenue: v,
            roas: s > 0 ? v / s : 0,
          };
        }
      } catch {}

      const adsEnriched = ads.map((a: any) => ({
        ...a,
        insights: adInsightsMap[a.id] || null,
      }));

      return {
        ok: true as const,
        data: { campaign, adsets, ads: adsEnriched, insights },
      };
    } catch (e) {
      return { ...errorPayload(e), data: null as any };
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

// ==================== EDIT AD / ADSET ====================
async function metaPost(path: string, body: Record<string, string>) {
  const { token } = getCreds();
  const url = new URL(`${BASE}/${path}`);
  const form = new URLSearchParams();
  form.set("access_token", token);
  for (const [k, v] of Object.entries(body)) form.set(k, v);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data?.error) {
    const err = data?.error || {};
    const e: any = new Error(err.message || `Meta API ${res.status}`);
    e.code = err.code;
    throw e;
  }
  return data;
}

export const updateAdStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { adId: string; status: "ACTIVE" | "PAUSED" }) => d)
  .handler(async ({ data }) => {
    try {
      const r = await metaPost(data.adId, { status: data.status });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateAdName = createServerFn({ method: "POST" })
  .inputValidator((d: { adId: string; name: string }) => d)
  .handler(async ({ data }) => {
    try {
      const r = await metaPost(data.adId, { name: data.name });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateAdsetStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { adsetId: string; status: "ACTIVE" | "PAUSED" }) => d)
  .handler(async ({ data }) => {
    try {
      const r = await metaPost(data.adsetId, { status: data.status });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateAdsetBudget = createServerFn({ method: "POST" })
  .inputValidator((d: { adsetId: string; dailyBudgetBRL: number }) => d)
  .handler(async ({ data }) => {
    try {
      const cents = Math.max(100, Math.round(data.dailyBudgetBRL * 100)).toString();
      const r = await metaPost(data.adsetId, { daily_budget: cents });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateAdsetSpendLimit = createServerFn({ method: "POST" })
  .inputValidator((d: { adsetId: string; minDailyBRL?: number; maxDailyBRL?: number }) => d)
  .handler(async ({ data }) => {
    try {
      const limit: any = {};
      if (data.minDailyBRL !== undefined) limit.min_daily_budget = Math.round(data.minDailyBRL * 100);
      if (data.maxDailyBRL !== undefined) limit.max_daily_budget = Math.round(data.maxDailyBRL * 100);
      
      const r = await metaPost(data.adsetId, { adset_spend_limit: JSON.stringify(limit) });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { campaignId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { token } = getCreds();
      const url = new URL(`${BASE}/${data.campaignId}`);
      url.searchParams.set("access_token", token);
      const res = await fetch(url.toString(), { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error?.message || "Erro ao deletar");
      return { ok: true as const, data: j };
    } catch (e) {
      return errorPayload(e);
    }
  });

