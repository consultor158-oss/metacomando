
export type WhatsAppTrigger = {
  metric: "ROAS" | "CPA" | "CTR" | "CVR";
  operator: ">" | "<";
  value: number;
  enabled: boolean;
};

export type WhatsAppConfig = {
  number: string;
  quickMessages: string[];
  enableUtms: boolean;
  triggers?: WhatsAppTrigger[];
  alertSummaryEnabled?: boolean;
};

const KEY_PREFIX = "metacomando.whatsapp.v1.";

export function getWhatsAppConfig(accountId: string): WhatsAppConfig {
  if (typeof window === "undefined") {
    return { number: "", quickMessages: [], enableUtms: true, triggers: [], alertSummaryEnabled: true };
  }
  const raw = localStorage.getItem(KEY_PREFIX + accountId);
  if (!raw) {
    // Fallback to legacy global number
    const globalNum = localStorage.getItem("whatsapp_number") || "";
    return { 
      number: globalNum, 
      quickMessages: [], 
      enableUtms: true, 
      triggers: [
        { metric: "ROAS", operator: "<", value: 2.0, enabled: true },
        { metric: "CPA", operator: ">", value: 50, enabled: true }
      ],
      alertSummaryEnabled: true
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.triggers) {
      parsed.triggers = [
        { metric: "ROAS", operator: "<", value: 2.0, enabled: true },
        { metric: "CPA", operator: ">", value: 50, enabled: true }
      ];
    }
    if (parsed.alertSummaryEnabled === undefined) {
      parsed.alertSummaryEnabled = true;
    }
    return parsed;
  } catch {
    return { number: "", quickMessages: [], enableUtms: true, triggers: [], alertSummaryEnabled: true };
  }
}

export function saveWhatsAppConfig(accountId: string, config: WhatsAppConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_PREFIX + accountId, JSON.stringify(config));
}

export function validateWhatsAppNumber(number: string): boolean {
  const clean = number.replace(/\D/g, "");
  // Brazilian numbers: 55 + DDD (2 digits) + 8 or 9 digits
  // International: at least 10 digits
  return clean.length >= 10 && clean.length <= 15;
}

export function generateWhatsAppLink(
  config: WhatsAppConfig,
  options: {
    messageIndex?: number;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  } = {}
): string {
  const cleanNum = config.number.replace(/\D/g, "");
  if (!cleanNum) return "";

  let text = "";
  if (options.messageIndex !== undefined && config.quickMessages[options.messageIndex]) {
    text = config.quickMessages[options.messageIndex];
  }

  if (config.enableUtms) {
    const utms = [];
    if (options.utmSource) utms.push(`utm_source=${encodeURIComponent(options.utmSource)}`);
    if (options.utmMedium) utms.push(`utm_medium=${encodeURIComponent(options.utmMedium)}`);
    if (options.utmCampaign) utms.push(`utm_campaign=${encodeURIComponent(options.utmCampaign)}`);
    if (options.utmContent) utms.push(`utm_content=${encodeURIComponent(options.utmContent)}`);
    if (options.utmTerm) utms.push(`utm_term=${encodeURIComponent(options.utmTerm)}`);
    
    if (utms.length > 0) {
      const utmString = utms.join("&");
      text = text ? `${text}\n\n[${utmString}]` : `[${utmString}]`;
    }
  }

  const url = new URL(`https://wa.me/${cleanNum}`);
  if (text) {
    url.searchParams.set("text", text);
  }

  return url.toString();
}
