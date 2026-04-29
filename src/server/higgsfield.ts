import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://platform.higgsfield.ai";

function getHiggsfieldCreds() {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const secret = process.env.HIGGSFIELD_API_SECRET;

  if (!keyId || !secret) {
    console.error("Higgsfield Credentials Missing: HIGGSFIELD_API_KEY_ID or HIGGSFIELD_API_SECRET not in env");
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
      console.log("Starting Higgsfield generation request:", { ...data, prompt: data.prompt.substring(0, 50) + "..." });
      const { keyId, secret } = getHiggsfieldCreds();
      
      const defaultModel = data.imageUrl 
        ? "higgsfield-ai/dop/standard" 
        : "higgsfield-ai/soul/standard";
        
      const modelId = data.modelId || defaultModel;
      
      const url = new URL(`${BASE_URL}/${modelId}`);
      if (data.webhookUrl) {
        url.searchParams.set("hf_webhook", data.webhookUrl);
      }
      
      console.log(`Calling Higgsfield API: ${url.toString()}`);
      
      const payload = {
        prompt: data.prompt,
        image_url: data.imageUrl,
        duration: data.duration,
        aspect_ratio: data.aspectRatio || "9:16",
        resolution: data.resolution || "720p",
      };

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Authorization": `Key ${keyId}:${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      console.log(`Higgsfield API Response Status: ${res.status}`, result);
      
      if (!res.ok) {
        // Detailed error extraction based on common Higgsfield API responses
        const errorMsg = result.detail || result.message || result.error || `Erro ${res.status}: Higgsfield API falhou`;
        
        // Specific user-friendly messages
        let userMessage = errorMsg;
        if (errorMsg === "not_enough_credits") {
          userMessage = "Créditos insuficientes na sua conta Higgsfield.";
        }
        
        console.error("Higgsfield API Error:", errorMsg);
        throw new Error(userMessage);
      }

      return { ok: true as const, data: result };
    } catch (e: any) {
      console.error("Exception in generateHiggsfieldCreative:", e);
      return { ok: false as const, error: e.message };
    }
  });

export const getHiggsfieldStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { requestId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { keyId, secret } = getHiggsfieldCreds();
      
      const url = `${BASE_URL}/requests/${data.requestId}/status`;
      console.log(`Checking Higgsfield status: ${url}`);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Key ${keyId}:${secret}`,
        },
      });

      const result = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = result.detail || result.message || result.error || `Erro ${res.status} ao verificar status`;
        console.error("Higgsfield Status Error:", errorMsg);
        throw new Error(errorMsg);
      }

      return { ok: true as const, data: result };
    } catch (e: any) {
      console.error("Exception in getHiggsfieldStatus:", e);
      return { ok: false as const, error: e.message };
    }
  });

export const cancelHiggsfieldRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { requestId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { keyId, secret } = getHiggsfieldCreds();
      
      const url = `${BASE_URL}/requests/${data.requestId}/cancel`;
      console.log(`Canceling Higgsfield request: ${url}`);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Key ${keyId}:${secret}`,
        },
      });

      if (res.status === 202) {
        return { ok: true as const };
      }
      
      const result = await res.json().catch(() => ({}));
      return { ok: false as const, error: result.detail || result.message || "Não foi possível cancelar a solicitação." };
    } catch (e: any) {
      console.error("Exception in cancelHiggsfieldRequest:", e);
      return { ok: false as const, error: e.message };
    }
  });