// Registro de auditoria local (localStorage) para ações automáticas e manuais
// Mostra quando, qual recomendação foi aplicada, sucesso/erro e impacto estimado.

import type { ActionType, Severity } from "./recommendations";

export interface AuditEntry {
  id: string;
  timestamp: number;
  mode: "manual" | "auto";
  campaignId: string;
  campaignName: string;
  action: ActionType;
  severity: Severity;
  title: string;
  status: "success" | "error" | "skipped";
  errorMessage?: string;
  estimatedSpendDelta?: number;
  estimatedRevenueDelta?: number;
  estimatedRoasDelta?: number;
}

const KEY = "meta_audit_log_v1";
const MAX = 500;

export function loadAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

export function appendAudit(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const log = loadAuditLog();
  log.unshift(full);
  if (log.length > MAX) log.length = MAX;
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
    window.dispatchEvent(new CustomEvent("audit-log-updated"));
  } catch {
    // noop (cota cheia)
  }
  return full;
}

export function clearAuditLog() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("audit-log-updated"));
}

// =============== Auto Mode Settings ===============

export interface AutoModeSettings {
  enabled: boolean;
  // severidades habilitadas para auto-apply
  applySeverities: Severity[];
  // ações específicas habilitadas
  applyActions: ActionType[];
  // hora do dia para rodar (0–23) — local time
  scheduleHour: number;
  // timestamp do último run
  lastRunAt?: number;
  // limite máximo de R$ que o auto pode mexer por dia (aumento total)
  maxDailySpendIncreaseCents: number;
}

const SETTINGS_KEY = "meta_auto_mode_v1";

const DEFAULTS: AutoModeSettings = {
  enabled: false,
  applySeverities: ["critical"],
  applyActions: ["PAUSE", "DECREASE_BUDGET"],
  scheduleHour: 9,
  maxDailySpendIncreaseCents: 5000, // R$ 50/dia de aumento máximo
};

export function loadAutoModeSettings(): AutoModeSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AutoModeSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveAutoModeSettings(s: AutoModeSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("auto-mode-updated"));
}

/**
 * Verifica se já é hora de rodar o auto hoje.
 * Roda uma vez por dia, na hora agendada (ou depois, se a página foi aberta tarde).
 */
export function shouldRunAutoNow(s: AutoModeSettings, now = Date.now()): boolean {
  if (!s.enabled) return false;
  const today = new Date(now);
  today.setHours(s.scheduleHour, 0, 0, 0);
  const scheduledToday = today.getTime();
  if (now < scheduledToday) return false;
  if (!s.lastRunAt) return true;
  const last = new Date(s.lastRunAt);
  // se o último run foi antes do horário agendado de hoje → roda
  return last.getTime() < scheduledToday;
}
