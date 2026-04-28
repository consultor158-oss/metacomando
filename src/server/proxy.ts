import { createServerFn } from "@tanstack/react-start";

export const proxyApiCall = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    url: string; 
    method: "GET" | "POST"; 
    headers: Record<string, string>; 
    body?: string 
  }) => d)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.method === "POST" ? data.body : undefined,
      });

      const text = await res.text();
      let responseData: any;
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }

      return { 
        ok: res.ok, 
        status: res.status, 
        data: responseData 
      };
    } catch (e: any) {
      return { 
        ok: false, 
        status: 0, 
        data: null, 
        error: e.message || "Erro no proxy do servidor" 
      };
    }
  });
