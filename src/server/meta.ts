import { createServerFn } from "@tanstack/react-start";
import { type CustomApi } from "../lib/customApis";

const GRAPH_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getCreds() {
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  
  if (!token || !account) {
    const missing = [];
    if (!token) missing.push("META_ACCESS_TOKEN");
    if (!account) missing.push("META_AD_ACCOUNT_ID");
    throw new Error(`Configuração pendente: ${missing.join(", ")} não encontrados nos Segredos do Lovable.`);
  }

  // Normalize account id to act_XXX
  const actId = account.startsWith("act_") ? account : `act_${account}`;
  return { token, actId };
}

export const testMetaConnection = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; accountId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const actId = data.accountId.startsWith("act_") ? data.accountId : `act_${data.accountId}`;
      const url = new URL(`${BASE}/${actId}`);
      url.searchParams.set("access_token", data.token);
      url.searchParams.set("fields", "name,currency,timezone_name");
      
      const res = await fetch(url.toString());
      const result = await res.json();
      
      if (!res.ok || result.error) {
        throw new Error(result.error?.message || "Erro ao validar credenciais");
      }
      
      return { ok: true as const, data: result };
    } catch (e: any) {
      return { ok: false as const, error: e.message };
    }
  });

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

async function metaPost(path: string, body: Record<string, any>) {
  const { token } = getCreds();
  const url = new URL(`${BASE}/${path}`);
  url.searchParams.set("access_token", token);
  
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    let msg = err.message || `Meta API ${res.status}`;
    if (err.error_user_title) msg = `${err.error_user_title}: ${err.error_user_msg || msg}`;
    const e: any = new Error(msg);
    e.code = err.code;
    e.fbtrace_id = err.fbtrace_id;
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

// ==================== UPDATE CAMPAIGN ====================
export const updateCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    campaignId: string; 
    name?: string; 
    status?: "ACTIVE" | "PAUSED" | "ARCHIVED"; 
    daily_budget?: number;
    lifetime_budget?: number;
    bid_strategy?: string;
    objective?: string;
    special_ad_categories?: string[];
    buying_type?: string;
  }) => d)
  .handler(async ({ data }) => {
    try {
      const body: Record<string, any> = {};
      if (data.name) body.name = data.name;
      if (data.status) body.status = data.status;
      if (data.daily_budget !== undefined && !isNaN(data.daily_budget)) body.daily_budget = String(data.daily_budget);
      if (data.lifetime_budget !== undefined && !isNaN(data.lifetime_budget)) body.lifetime_budget = String(data.lifetime_budget);
      if (data.bid_strategy) body.bid_strategy = data.bid_strategy;
      if (data.objective) body.objective = data.objective;
      if (data.special_ad_categories) body.special_ad_categories = data.special_ad_categories;
      if (data.buying_type) body.buying_type = data.buying_type;
      
      const result = await metaPost(data.campaignId, body);
      return { ok: true as const, data: result };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateCampaignStatus = updateCampaign;

// ==================== UPDATE BUDGET (deprecated/alias) ====================
export const updateBudget = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; dailyBudgetCents: number; type: "campaign" | "adset" }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await metaPost(data.id, { 
        daily_budget: String(data.dailyBudgetCents),
        ...(data.type === "adset" ? { is_adset_budget_sharing_enabled: false } : {})
      });
      return { ok: true as const, data: result };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== GET PAGES ====================
export const getPages = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const pages = await metaFetch("me/accounts", { fields: "id,name,access_token,category,picture" });
      return { ok: true as const, data: pages.data ?? [] };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== CREATE CAMPAIGN (used by scale strategies) ====================
// ==================== CREATE FULL SCALE (Campaign + AdSet + Ad) ====================
export const createFullScale = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      name: string;
      objective: string;
      status?: "ACTIVE" | "PAUSED";
      dailyBudgetCents?: number;
      strategy?: string;
      pageId?: string;
      destination?: "WHATSAPP" | "SALES" | "INSTAGRAM_DIRECT" | "MESSENGER";
      pixelId?: string;
      conversionEvent?: string;
      is_adset_budget_sharing_enabled?: boolean;
      destinationUrl?: string;
      targeting?: any;
      creatives?: Array<{
        id?: string;
        image_url?: string;
        video_id?: string;
        primaryText: string;
        headline: string;
        cta: string;
      }>;
    }) => d,

  )
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      
      // Dynamic import to get strategies
      const { SCALE_STRATEGIES } = await import("../lib/scales");
      const strategyDef = SCALE_STRATEGIES.find(s => s.id === data.strategy);
      const isCBO = strategyDef?.defaults?.isCBO ?? false;
      const adsetCount = strategyDef?.defaults?.adsetCount ?? 1;

      let pixelId = data.pixelId;
      if (!pixelId && data.destination === "SALES") {
        try {
          const pixels = await metaFetch(`${actId}/adspixels`, { fields: "id" });
          if (pixels.data?.[0]) pixelId = pixels.data[0].id;
        } catch (e) {
          console.error("Erro ao buscar pixel:", e);
        }
      }


      // 1. Create Campaign
      const campaignBody: Record<string, any> = {
        name: data.name,
        objective: data.objective || "OUTCOME_SALES",
        status: data.status || "PAUSED",
        special_ad_categories: [],
      };

      if (isCBO) {
        campaignBody.daily_budget = String(Math.max(1000, data.dailyBudgetCents || 2000));
        campaignBody.bid_strategy = "LOWEST_COST_WITHOUT_CAP";
      }

      const campaign = await metaPost(`${actId}/campaigns`, campaignBody);
      const campaignId = campaign.id;

      const adsets = [];
      const adsToCreate = data.creatives || [];
      const creationLogs: string[] = [];

      for (let i = 0; i < adsetCount; i++) {
        try {
          // Clean targeting for Meta API
          const cleanTargeting: any = { 
            geo_locations: { countries: ["BR"] },
            targeting_automation: { advantage_audience: 1 }
          };
          
          if (data.targeting) {
             if (data.targeting.geo_locations) {
               cleanTargeting.geo_locations = data.targeting.geo_locations;
             }
             if (data.targeting.age_min) cleanTargeting.age_min = data.targeting.age_min;
             if (data.targeting.age_max) cleanTargeting.age_max = data.targeting.age_max;
             if (data.targeting.genders) cleanTargeting.genders = data.targeting.genders;
          }
          
          const adsetBody: Record<string, any> = {
            name: `[ULTRA] ${data.name} - Conjunto ${i + 1}`,
            campaign_id: campaignId,
            status: data.status || "PAUSED",
            billing_event: "IMPRESSIONS",
            optimization_goal: data.destination === "WHATSAPP" ? "CONVERSATIONS" : (pixelId && pixelId !== "PLACEHOLDER" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS"),
            targeting: cleanTargeting,
          };

          if (!isCBO) {
            adsetBody.daily_budget = String(Math.max(1000, data.dailyBudgetCents || 2000));
            // Meta requirement: when using adset budget (non-CBO), this field must be explicitly set
            adsetBody.is_adset_budget_sharing_enabled = data.is_adset_budget_sharing_enabled ?? false;
          }

          if (data.destination === "WHATSAPP") {
            adsetBody.destination_type = "WHATSAPP";
            adsetBody.promoted_object = { page_id: data.pageId };
          } else {
            adsetBody.destination_type = "WEBSITE";
            if (pixelId && pixelId !== "PLACEHOLDER") {
              adsetBody.promoted_object = { pixel_id: pixelId, custom_event_type: "PURCHASE" };
            }
          }

          const adset = await metaPost(`${actId}/adsets`, adsetBody);
          adsets.push(adset.id);
          creationLogs.push(`Conjunto ${i + 1} criado: ${adset.id}`);

          const adPromises = adsToCreate.map(async (creative, idx) => {
             try {
               let adBody: Record<string, any> = {
                 name: `Anúncio ${idx + 1} - ${adset.id}`,
                 adset_id: adset.id,
                 status: data.status || "PAUSED",
               };

                const isExistingCreative = creative.id && /^\d+$/.test(creative.id) && !creative.id.startsWith("hash_");
                
                if (isExistingCreative) {
                  adBody.creative = { creative_id: creative.id };
                } else {
                  const objectStorySpec: any = { page_id: data.pageId };
                  const ctaType = data.destination === "WHATSAPP" ? "SEND_MESSAGE" : (creative.cta || "SHOP_NOW");
                  const ctaValue: any = {};
                  if (data.destination === "WHATSAPP") {
                    ctaValue.app_destination = "WHATSAPP";
                  } else {
                    ctaValue.link = data.destinationUrl || "https://example.com";
                  }

                  if (creative.video_id && !creative.video_id.startsWith("uploaded_")) {
                    objectStorySpec.video_data = {
                      video_id: creative.video_id,
                      image_url: creative.image_url,
                      message: creative.primaryText,
                      call_to_action: { type: ctaType, value: ctaValue }
                    };
                  } else {
                    const linkData: any = {
                      message: creative.primaryText,
                      link: data.destination === "WHATSAPP" ? `https://www.facebook.com/${data.pageId}` : (data.destinationUrl || "https://example.com"),
                      name: creative.headline,
                      call_to_action: { type: ctaType, value: ctaValue },
                    };
                    
                    if (creative.id && creative.id.startsWith("hash_")) {
                      linkData.image_hash = creative.id.replace("hash_", "");
                    } else if (creative.image_url && !creative.image_url.startsWith("data:")) {
                      linkData.picture = creative.image_url;
                    }
                    objectStorySpec.link_data = linkData;
                  }
                  adBody.creative = {
                    name: `Creative ${idx + 1} - ${Date.now()}`,
                    object_story_spec: objectStorySpec
                  };
                }
               const ad = await metaPost(`${actId}/ads`, adBody);
               return { ok: true, id: ad.id };
             } catch (adError: any) {
               console.error("Erro ao criar anúncio:", adError.message);
               return { ok: false, error: adError.message };
             }
          });
          const adsResults = await Promise.all(adPromises);
          const adsSucceeded = adsResults.filter(r => r.ok).length;
          creationLogs.push(`  - ${adsSucceeded}/${adsToCreate.length} anúncios criados com sucesso.`);
        } catch (adsetError: any) {
          console.error(`Erro ao criar conjunto ${i + 1}:`, adsetError.message);
          creationLogs.push(`Erro no Conjunto ${i + 1}: ${adsetError.message}`);
        }
      }
      return { 
        ok: true as const, 
        data: campaign, 
        strategy: data.strategy,
        logs: creationLogs,
        created: { campaignId, adsetsCount: adsets.length, adsCount: adsets.length * adsToCreate.length }
      };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const createCampaign = createFullScale; // Alias for backward compatibility

// ==================== DUPLICATE CAMPAIGN (clone existing as template) ====================
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
      const { actId } = getCreds();
      // 1) lê a campanha origem
      const src = await metaFetch(data.sourceCampaignId, {
        fields:
          "name,objective,buying_type,bid_strategy,daily_budget,lifetime_budget,special_ad_categories,status",
      });

      const finalName =
        data.newName ||
        `${src.name} — cópia ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

      const body: Record<string, any> = {
        name: finalName,
        objective: src.objective || "OUTCOME_SALES",
        buying_type: src.buying_type || "AUCTION",
        status: data.status || "PAUSED",
        special_ad_categories: src.special_ad_categories || [],
      };

      // budget: usa o sobrescrito; senão herda da origem
      const budgetCents =
        data.dailyBudgetCents ?? (src.daily_budget ? parseInt(src.daily_budget) : 0);
      if (budgetCents > 0) body.daily_budget = String(budgetCents);

      if (src.bid_strategy) body.bid_strategy = src.bid_strategy;

      const result = await metaPost(`${actId}/campaigns`, body);
      return {
        ok: true as const,
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
export const getPixels = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { actId } = getCreds();
      const res = await metaFetch(`${actId}/adspixels`, { fields: "id,name" });
      return res.data || [];
    } catch (e) {
      console.error("Erro ao buscar pixels:", e);
      return [];
    }
  });

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
      return { ok: true as const, data: res.data ?? [] };
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
      return { ok: true as const, raw: content, parsed };
    } catch (e) {
      return errorPayload(e);
    }
  });

// ==================== CONVERSION FUNNEL (account-level) ====================
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
        fields: "spend,impressions,clicks,inline_link_clicks,ctr,cpc,actions,action_values",
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

// ==================== GEOGRAPHIC BREAKDOWN ====================
export const getGeoInsights = createServerFn({ method: "GET" })
  .inputValidator((d: { datePreset?: string; type: "region" | "country" | "city" }) => d)
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      const datePreset = data.datePreset || "last_30d";
      const res = await metaFetch(`${actId}/insights`, {
        date_preset: datePreset,
        level: "account",
        fields: "spend,impressions,clicks,actions,action_values",
        breakdowns: data.type,
      });
      return { ok: true as const, data: res.data ?? [] };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== GET AD ACCOUNT CREATIVES ====================
export const getAccountCreatives = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { actId } = getCreds();
      const res = await metaFetch(`${actId}/adcreatives`, {
        fields: "id,name,title,body,image_url,thumbnail_url,object_story_spec,video_id,object_type",
        limit: "100",
      });
      return { ok: true as const, data: res.data ?? [] };
    } catch (e) {
      return { ...errorPayload(e), data: [] as any[] };
    }
  });

// ==================== UPLOAD IMAGE ====================
export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((d: { bytes: string; filename: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { actId } = getCreds();
      // Remove data:image/...;base64, prefix if present
      const base64Data = data.bytes.includes(",") ? data.bytes.split(",")[1] : data.bytes;
      
      const res = await metaPost(`${actId}/adimages`, {
        bytes: base64Data,
        name: data.filename
      });
      
      // Meta returns { images: { filename: { hash: "..." } } }
      const hash = Object.values(res.images || {})[0] as any;
      
      return { 
        ok: true as const, 
        data: { 
          id: "hash_" + hash.hash,
          url: data.bytes
        } 
      };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const uploadVideo = createServerFn({ method: "POST" })
  .inputValidator((d: { url?: string; bytes?: string; filename: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { actId, token } = getCreds();
      
      // Se tivermos apenas a URL (como do Heygen), a Meta permite upload via file_url em alguns casos,
      // mas o método mais robusto é o async upload.
      const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${actId}/advideos`);
      url.searchParams.set("access_token", token);

      const body: Record<string, any> = {
        name: data.filename,
      };

      if (data.url) {
        body.file_url = data.url;
      } else if (data.bytes) {
        // Se for base64
        const base64Data = data.bytes.includes(",") ? data.bytes.split(",")[1] : data.bytes;
        body.video_file_chunk = base64Data;
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error?.message || "Erro no upload de vídeo para Meta");

      return { 
        ok: true as const, 
        data: { 
          id: result.id || result.video_id,
          url: data.url || data.bytes
        } 
      };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const deleteCreative = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { token } = getCreds();
      const url = new URL(`${BASE}/${data.id}`);
      url.searchParams.set("access_token", token);
      const res = await fetch(url.toString(), { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error?.message || "Erro ao deletar");
      return { ok: true as const, data: j };
    } catch (e) {
      return errorPayload(e);
    }
  });


// ==================== CAMPAIGN-LEVEL CONVERSION DETAILS ====================
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
          really_sells: purchases > 0 && revenue > spend,
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
      // const { token } = getCreds(); // Removed unused token
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

      // Ads + creatives — paginate through all
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

      // Resolve missing thumbnails via preview endpoint and other sources
      await Promise.all(
        ads.map(async (a: any) => {
          const cre = a.creative || {};
          const story = cre.object_story_spec || {};
          const link = story.link_data || story.video_data || {};
          
          // Try to use object_story_spec data if image_url is missing
          if (!cre.image_url && !cre.thumbnail_url) {
            if (link.picture) cre.image_url = link.picture;
          }

          const hasImg = cre.image_url || cre.thumbnail_url;
          if (hasImg) return;

          try {
            // Try different preview formats if standard fails
            const formats = ["MOBILE_FEED_STANDARD", "INSTAGRAM_STORY", "FACEBOOK_STORY"];
            for (const format of formats) {
              const prev = await metaFetch(`${a.id}/previews`, {
                ad_format: format,
              });
              const body: string = prev?.data?.[0]?.body || "";
              const m = body.match(/src=\\?"(https:[^"\\]+\.(?:jpg|jpeg|png|webp|gif)[^"\\]*)/i);
              if (m) {
                a._previewImage = m[1].replace(/&amp;/g, "&").replace(/\\/g, "");
                break;
              }
            }
          } catch (err) {
            console.error(`Erro ao buscar preview para o anúncio ${a.id}:`, err);
          }
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

      // Insights por ad
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
    return { ok: true as const, data: info };
  } catch (e) {
    return errorPayload(e);
  }
});

// ==================== EDIT AD / ADSET ====================
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

export const updateAdsetName = createServerFn({ method: "POST" })
  .inputValidator((d: { adsetId: string; name: string }) => d)
  .handler(async ({ data }) => {
    try {
      const r = await metaPost(data.adsetId, { 
        name: data.name,
        is_adset_budget_sharing_enabled: false 
      });
      return { ok: true as const, data: r };
    } catch (e) {
      return errorPayload(e);
    }
  });

export const updateAdsetStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { adsetId: string; status: "ACTIVE" | "PAUSED" }) => d)
  .handler(async ({ data }) => {
    try {
      const r = await metaPost(data.adsetId, { 
        status: data.status,
        is_adset_budget_sharing_enabled: false 
      });
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
      const r = await metaPost(data.adsetId, { 
        daily_budget: cents,
        is_adset_budget_sharing_enabled: false 
      });
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
