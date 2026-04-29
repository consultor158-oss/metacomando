import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://platform.higgsfield.ai";

function getHiggsfieldCreds() {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const secret = process.env.HIGGSFIELD_API_SECRET;

  if (!keyId || !secret) {
    throw new Error("Configuração Higgsfield pendente: HIGGSFIELD_API_KEY_ID ou HIGGSFIELD_API_SECRET não encontrados.");
  }

  return { keyId, secret };
}

export const generateHiggsfieldCreative = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    prompt: string; 
    modelId?: string; 
    aspectRatio?: string; 
    resolution?: string;
    imageUrl?: string;
    duration?: number;
    webhookUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    try {
      const { keyId, secret } = getHiggsfieldCreds();
      
      const defaultModel = data.imageUrl 
        ? "higgsfield-ai/dop/standard" 
        : "higgsfield-ai/soul/standard";
        
      const modelId = data.modelId || defaultModel;
      
      const baseUrl = new URL(`${BASE_URL}/${modelId}`);
      if (data.webhookUrl) {
        baseUrl.searchParams.set("hf_webhook", data.webhookUrl);
      }
      
      const res = await fetch(baseUrl.toString(), {
        method: "POST",
        headers: {
          "Authorization": `Key ${keyId}:${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: data.prompt,
          image_url: data.imageUrl,
          duration: data.duration,
          aspect_ratio: data.aspectRatio || "9:16",
          resolution: data.resolution || "720p",
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || result.error || "Erro ao solicitar geração Higgsfield");
      }

      return { ok: true as const, data: result };
    } catch (e: any) {
      return { ok: false as const, error: e.message };
    }
  });

export const getHiggsfieldStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { requestId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { keyId, secret } = getHiggsfieldCreds();
      
      const res = await fetch(`${BASE_URL}/requests/${data.requestId}/status`, {
        method: "GET",
        headers: {
          "Authorization": `Key ${keyId}:${secret}`,
        },
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || result.error || "Erro ao verificar status Higgsfield");
      }

      return { ok: true as const, data: result };
    } catch (e: any) {
      return { ok: false as const, error: e.message };
    }
  });
