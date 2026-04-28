// Gerenciamento de APIs personalizadas (armazenadas no navegador)
// Permite ao usuário cadastrar APIs externas (Webhook, CRM, ZeroBounce, OpenAI extra, etc.)
// e fazer chamadas de teste direto pelo dashboard.

export type CustomApi = {
  id: string;
  name: string;
  baseUrl: string;
  authType: "none" | "bearer" | "header" | "query";
  authKey?: string; // nome do header/query param (ex: "X-API-Key")
  authValue?: string; // valor do token / api key
  defaultPath?: string;
  notes?: string;
  createdAt: number;
};

const KEY = "metacomando.customApis.v1";

export function loadCustomApis(): CustomApi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomApis(list: CustomApi[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addCustomApi(api: Omit<CustomApi, "id" | "createdAt">): CustomApi {
  const list = loadCustomApis();
  const novo: CustomApi = {
    ...api,
    id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  saveCustomApis([novo, ...list]);
  return novo;
}

export function removeCustomApi(id: string) {
  saveCustomApis(loadCustomApis().filter((a) => a.id !== id));
}

export function updateCustomApi(id: string, patch: Partial<CustomApi>) {
  saveCustomApis(loadCustomApis().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

export async function testCustomApi(
  api: CustomApi,
  pathOverride?: string,
  method: "GET" | "POST" = "GET",
  body?: string,
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const path = pathOverride ?? api.defaultPath ?? "";
    // Garantir que a URL base termine com / se o path não começar com /
    const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl : api.baseUrl + '/';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = new URL(cleanPath, baseUrl);
    
    const headers: Record<string, string> = { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    if (api.authType === "bearer" && api.authValue) {
      headers["Authorization"] = `Bearer ${api.authValue}`;
    } else if (api.authType === "header" && api.authKey && api.authValue) {
      headers[api.authKey] = api.authValue;
    } else if (api.authType === "query" && api.authKey && api.authValue) {
      url.searchParams.set(api.authKey, api.authValue);
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: method === "POST" ? body || (api.name.toLowerCase().includes("heygen") ? JSON.stringify({ video_inputs: [] }) : undefined) : undefined,
    });
    
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    console.error("Erro no teste da API:", e);
    return { ok: false, status: 0, data: null, error: e?.message || "Falha de rede" };
  }
}
