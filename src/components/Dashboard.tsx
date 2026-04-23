import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Target,
  DollarSign,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Pause,
  Play,
  Sparkles,
  Upload,
  Bell,
  FileDown,
  Zap,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Loader2,
  X,
  Trash2,
  Plus,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Check,
  MessageCircle,
} from "lucide-react";
import {
  getAccountInsights,
  getCampaigns,
  getAccountInfo,
  updateCampaignStatus,
  updateBudget,
  createCampaign,
  duplicateCampaign,
  generateAdCopy,
  getConversionFunnel,
  getClickBreakdown,
  getCampaignsConversion,
  getCampaignDetails,
  updateAdStatus,
  updateAdName,
  updateAdsetStatus,
  updateAdsetBudget,
  updateAdsetSpendLimit,
  deleteCampaign,
} from "../server/meta";
import {
  loadCustomApis,
  addCustomApi,
  removeCustomApi,
  testCustomApi,
  type CustomApi,
} from "../lib/customApis";
import { SCALE_STRATEGIES, type ScaleStrategy } from "../lib/scales";
import {
  generateRecommendations,
  ACTION_LABELS,
  SEVERITY_STYLES,
  type Recommendation,
  type Severity,
  type ActionType,
} from "../lib/recommendations";
import { estimateImpact, type ImpactEstimate } from "../lib/impact";
import {
  loadAuditLog,
  appendAudit,
  clearAuditLog,
  loadAutoModeSettings,
  saveAutoModeSettings,
  shouldRunAutoNow,
  type AuditEntry,
  type AutoModeSettings,
} from "../lib/auditLog";
import { formatBRL, formatNumber, formatPct } from "../lib/format";

type Tab = "overview" | "analise" | "controle" | "escalas" | "ia" | "automacao";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Visão Geral", icon: Activity },
  { id: "analise", label: "Análise", icon: TrendingUp },
  { id: "controle", label: "Controle", icon: Target },
  { id: "escalas", label: "Escalas", icon: Zap },
  { id: "ia", label: "APIs / IA", icon: Sparkles },
  { id: "automacao", label: "Automação", icon: Bell },
];

// staleTime por período (período curto = atualiza mais)
const STALE_BY_PERIOD: Record<string, number> = {
  today: 60_000,           // 1 min
  yesterday: 10 * 60_000,  // 10 min
  last_7d: 5 * 60_000,     // 5 min
  last_14d: 10 * 60_000,
  last_30d: 15 * 60_000,
  this_month: 5 * 60_000,
};

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [datePreset, setDatePreset] = useState("last_7d");
  const [onlyActive, setOnlyActive] = useState(true);
  const qc = useQueryClient();

  const stale = STALE_BY_PERIOD[datePreset] ?? 5 * 60_000;

  const account = useQuery({
    queryKey: ["meta-account"],
    queryFn: () => getAccountInfo(),
    staleTime: 30 * 60_000,
  });

  const insights = useQuery({
    queryKey: ["meta-insights", datePreset],
    queryFn: () => getAccountInsights({ data: { datePreset } }),
    staleTime: stale,
    refetchInterval: stale * 2,
  });

  const campaigns = useQuery({
    queryKey: ["meta-campaigns", datePreset, onlyActive],
    queryFn: () => getCampaigns({ data: { datePreset, onlyActive } }),
    staleTime: stale,
    refetchInterval: stale * 2,
  });

  const funnel = useQuery({
    queryKey: ["meta-funnel", datePreset],
    queryFn: () => getConversionFunnel({ data: { datePreset } }),
    staleTime: stale,
  });

  const clickBreakdown = useQuery({
    queryKey: ["meta-click-breakdown", datePreset],
    queryFn: () => getClickBreakdown({ data: { datePreset } }),
    staleTime: stale,
  });

  const campConv = useQuery({
    queryKey: ["meta-camp-conv", datePreset, onlyActive],
    queryFn: () => getCampaignsConversion({ data: { datePreset, onlyActive } }),
    staleTime: stale,
  });

  const acc = account.data?.ok ? account.data.data : null;
  const insightsRows = useMemo(() => (insights.data?.ok ? (insights.data.data as any[]) : []), [insights.data]);
  const camps = useMemo(() => (campaigns.data?.ok ? (campaigns.data.data as any[]) : []), [campaigns.data]);

  // Detect token expired
  const tokenExpired =
    (account.data && !account.data.ok && (account.data as any).is_token_expired) ||
    (insights.data && !insights.data.ok && (insights.data as any).is_token_expired) ||
    (campaigns.data && !campaigns.data.ok && (campaigns.data as any).is_token_expired);

  const apiError =
    (account.data && !account.data.ok && account.data.error) ||
    (insights.data && !insights.data.ok && insights.data.error) ||
    (campaigns.data && !campaigns.data.ok && campaigns.data.error) ||
    null;

  // Aggregate KPIs
  const totals = useMemo(
    () =>
      (insightsRows as any[]).reduce(
        (acc: any, r: any) => {
          const purchases =
            (r.actions ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
          const purchaseValue =
            (r.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
          acc.spend += parseFloat(r.spend || "0");
          acc.impressions += parseInt(r.impressions || "0");
          acc.clicks += parseInt(r.clicks || "0");
          acc.conversions += parseFloat(purchases);
          acc.revenue += parseFloat(purchaseValue);
          return acc;
        },
        { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      ),
    [insightsRows],
  );

  const overallROAS = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const overallCPA = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
  const overallCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const refreshAll = async () => {
    toast.info("Atualizando dados Meta…");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["meta-account"] }),
      qc.invalidateQueries({ queryKey: ["meta-insights"] }),
      qc.invalidateQueries({ queryKey: ["meta-campaigns"] }),
      qc.invalidateQueries({ queryKey: ["meta-funnel"] }),
      qc.invalidateQueries({ queryKey: ["meta-click-breakdown"] }),
      qc.invalidateQueries({ queryKey: ["meta-camp-conv"] }),
    ]);
    toast.success("Dados atualizados!");
  };

  const anyLoading =
    account.isFetching ||
    insights.isFetching ||
    campaigns.isFetching ||
    funnel.isFetching ||
    clickBreakdown.isFetching ||
    campConv.isFetching;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        acc={acc}
        datePreset={datePreset}
        onDatePreset={setDatePreset}
        onlyActive={onlyActive}
        onOnlyActive={setOnlyActive}
        onRefresh={refreshAll}
        loading={anyLoading}
      />

      {tokenExpired && <TokenExpiredBanner msg={apiError || ""} />}
      {!tokenExpired && apiError && <ApiErrorBanner msg={apiError} onRefresh={refreshAll} />}

      <Tabs current={tab} onChange={setTab} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {tab === "overview" && (
          <Overview
            totals={totals}
            roas={overallROAS}
            cpa={overallCPA}
            ctr={overallCTR}
            insightsRows={insightsRows}
            camps={camps}
            loadingInsights={insights.isFetching}
            loadingCampaigns={campaigns.isFetching}
            onRefreshInsights={() => qc.invalidateQueries({ queryKey: ["meta-insights", datePreset] })}
            onRefreshCampaigns={() => qc.invalidateQueries({ queryKey: ["meta-campaigns"] })}
          />
        )}
        {tab === "analise" && (
          <Analise
            camps={camps}
            totals={totals}
            loading={campaigns.isFetching}
            funnel={funnel.data?.ok ? funnel.data.data : null}
            funnelLoading={funnel.isFetching}
            breakdown={clickBreakdown.data?.ok ? clickBreakdown.data.data : []}
            breakdownLoading={clickBreakdown.isFetching}
            campConv={campConv.data?.ok ? campConv.data.data : []}
            campConvLoading={campConv.isFetching}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ["meta-funnel"] });
              qc.invalidateQueries({ queryKey: ["meta-click-breakdown"] });
              qc.invalidateQueries({ queryKey: ["meta-camp-conv"] });
            }}
          />
        )}
        {tab === "controle" && (
          <Controle
            camps={camps}
            loading={campaigns.isFetching}
            onRefresh={() => qc.invalidateQueries({ queryKey: ["meta-campaigns"] })}
          />
        )}
        {tab === "escalas" && (
          <Escalas
            camps={camps}
            campConv={campConv.data?.ok ? campConv.data.data : []}
          />
        )}
        {tab === "ia" && <IATab />}
        {tab === "automacao" && (
          <Automacao
            camps={camps}
            campConv={campConv.data?.ok ? campConv.data.data : []}
            roas={overallROAS}
          />
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Meta Ads Dashboard • Graph API v21.0 • cache por período • período atual: {datePreset}
      </footer>
    </div>
  );
}

// ============== HEADER ==============
function Header({ acc, datePreset, onDatePreset, onlyActive, onOnlyActive, onRefresh, loading }: any) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-4 text-lg font-bold text-primary-foreground">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Meta Ads Ultra</h1>
            <p className="text-xs text-muted-foreground">
              {acc ? `${acc.name} • ${acc.currency} • ${acc.id}` : loading ? "Carregando…" : "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => onOnlyActive(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Só ativas
          </label>
          <select
            value={datePreset}
            onChange={(e) => onDatePreset(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="last_7d">Últimos 7 dias</option>
            <option value="last_14d">Últimos 14 dias</option>
            <option value="last_30d">Últimos 30 dias</option>
            <option value="this_month">Este mês</option>
          </select>
          <button
            onClick={() => {
              const num = localStorage.getItem("whatsapp_number") || "";
              const cleanNum = num.replace(/\D/g, "");
              if (!cleanNum) {
                const newNum = prompt("Digite seu número do WhatsApp com DDD (ex: 5511999999999):");
                if (newNum) localStorage.setItem("whatsapp_number", newNum.replace(/\D/g, ""));
              } else {
                window.open(`https://wa.me/${cleanNum}`, "_blank");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[oklch(0.7_0.18_162)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar agora
          </button>
        </div>
      </div>
    </header>
  );
}

function TokenExpiredBanner({ msg }: { msg: string }) {
  return (
    <div className="border-b-2 border-destructive bg-destructive/15">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-destructive">Seu token Meta expirou</h3>
            <p className="mt-1 text-xs text-foreground/80">{msg}</p>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium text-primary hover:underline">
                Como gerar um novo token de longa duração (60 dias) ▼
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-foreground/80">
                <li>
                  Acesse{" "}
                  <a
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Graph API Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Selecione seu app, marque as permissões: <code className="rounded bg-muted px-1">ads_management</code>, <code className="rounded bg-muted px-1">ads_read</code>, <code className="rounded bg-muted px-1">business_management</code></li>
                <li>Clique em <strong>Generate Access Token</strong></li>
                <li>
                  Cole o token em{" "}
                  <a
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    href="https://developers.facebook.com/tools/debug/accesstoken/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Access Token Debugger <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  e clique em <strong>Extend Access Token</strong> (gera o de 60 dias)
                </li>
                <li>
                  Volte aqui e atualize o secret <code className="rounded bg-muted px-1">META_ACCESS_TOKEN</code> nas configurações do projeto.
                </li>
                <li>Clique em "Atualizar agora" no topo.</li>
              </ol>
              <p className="mt-3 rounded bg-muted/50 p-2 text-foreground/70">
                💡 Para tokens permanentes (system user), gere via Business Settings → System Users → Generate Token.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiErrorBanner({ msg, onRefresh }: { msg: string; onRefresh: () => void }) {
  return (
    <div className="border-b border-destructive/30 bg-destructive/10">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-destructive sm:px-6 lg:px-8">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Meta API: {msg}</span>
        <button onClick={onRefresh} className="rounded bg-destructive/20 px-2 py-1 text-xs font-medium hover:bg-destructive/30">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

// ============== TABS ==============
function Tabs({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="border-b border-border bg-card/30">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4 lg:px-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============== KPI ==============
function Kpi({ label, value, icon: Icon, trend, accent = "primary", loading }: any) {
  const colors: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-[oklch(0.7_0.18_162/0.2)] to-[oklch(0.7_0.18_162/0.05)] text-[oklch(0.7_0.18_162)]",
    warning: "from-[oklch(0.77_0.19_70/0.2)] to-[oklch(0.77_0.19_70/0.05)] text-[oklch(0.77_0.19_70)]",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          )}
          {trend && !loading && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colors[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ============== SECTION HEADER (with refresh) ==============
function SectionHeader({
  title,
  subtitle,
  loading,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
}

// ============== OVERVIEW ==============
function Overview({
  totals,
  roas,
  cpa,
  ctr,
  insightsRows,
  camps,
  loadingInsights,
  loadingCampaigns,
  onRefreshInsights,
  onRefreshCampaigns,
}: any) {
  const chartData = (insightsRows as any[]).map((r) => {
    const purchases = (r.actions ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
    const purchaseValue = (r.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value || "0";
    const spend = parseFloat(r.spend || "0");
    const conv = parseFloat(purchases);
    return {
      date: r.date_start?.slice(5) || "",
      gasto: spend,
      receita: parseFloat(purchaseValue),
      roas: spend > 0 ? parseFloat(purchaseValue) / spend : 0,
      cpa: conv > 0 ? spend / conv : 0,
      conversoes: conv,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Gasto" value={formatBRL(totals.spend)} icon={DollarSign} loading={loadingInsights} />
        <Kpi
          label="ROAS"
          value={`${roas.toFixed(2)}x`}
          icon={TrendingUp}
          accent={roas >= 2 ? "success" : "warning"}
          trend={roas >= 2 ? "Saudável (≥2x)" : "Abaixo do alvo"}
          loading={loadingInsights}
        />
        <Kpi label="CPA" value={formatBRL(cpa)} icon={Target} accent={cpa < 10 ? "success" : "destructive"} loading={loadingInsights} />
        <Kpi label="Conversões" value={formatNumber(totals.conversions)} icon={ShoppingCart} loading={loadingInsights} />
        <Kpi label="Impressões" value={formatNumber(totals.impressions)} icon={Eye} loading={loadingInsights} />
        <Kpi label="Cliques" value={formatNumber(totals.clicks)} icon={MousePointerClick} loading={loadingInsights} />
        <Kpi label="CTR" value={formatPct(ctr)} icon={Activity} accent={ctr > 1 ? "success" : "warning"} loading={loadingInsights} />
        <Kpi label="Receita" value={formatBRL(totals.revenue)} icon={DollarSign} accent="success" loading={loadingInsights} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeader title="Performance Diária" subtitle="Gasto vs Receita nos últimos dias" loading={loadingInsights} onRefresh={onRefreshInsights} />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 265)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 265)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.18 162)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.7 0.18 162)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.7 0.04 257)" }} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.7 0.04 257)" }} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.025 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="gasto" stroke="oklch(0.65 0.22 265)" fill="url(#gradGasto)" />
                <Area type="monotone" dataKey="receita" stroke="oklch(0.7 0.18 162)" fill="url(#gradReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.7 0.04 257)" }} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.7 0.04 257)" }} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.025 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="roas" fill="oklch(0.7 0.18 162)" name="ROAS" />
                <Bar dataKey="cpa" fill="oklch(0.77 0.19 70)" name="CPA (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {!loadingInsights && chartData.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados no período selecionado</p>
        )}
      </div>

      <CampaignsTable camps={camps} loading={loadingCampaigns} onRefresh={onRefreshCampaigns} />
    </div>
  );
}


function CampaignsTable({ camps, loading, onRefresh }: { camps: any[]; loading: boolean; onRefresh: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <SectionHeader title="Campanhas" subtitle={`${camps.length} encontradas no período • clique para ver detalhes`} loading={loading} onRefresh={onRefresh} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Gasto</th>
              <th className="px-5 py-3 text-right">Receita</th>
              <th className="px-5 py-3 text-right">ROAS</th>
              <th className="px-5 py-3 text-right">CPA</th>
              <th className="px-5 py-3 text-right">Conv.</th>
              <th className="px-5 py-3 text-right">CTR</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {loading && camps.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={9} className="px-5 py-4">
                    <div className="h-5 animate-pulse rounded bg-muted/60" />
                  </td>
                </tr>
              ))
            ) : camps.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                  Nenhuma campanha encontrada no período
                </td>
              </tr>
            ) : (
              camps.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-accent/30"
                >
                  <td className="max-w-xs truncate px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.effective_status || c.status} />
                  </td>
                  <td className="px-5 py-3 text-right">{formatBRL(c.spend)}</td>
                  <td className="px-5 py-3 text-right">{formatBRL(c.revenue)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${c.roas >= 2 ? "text-[oklch(0.7_0.18_162)]" : "text-[oklch(0.77_0.19_70)]"}`}>
                    {c.roas.toFixed(2)}x
                  </td>
                  <td className="px-5 py-3 text-right">{formatBRL(c.cpa)}</td>
                  <td className="px-5 py-3 text-right">{formatNumber(c.conversions)}</td>
                  <td className="px-5 py-3 text-right">{formatPct(c.ctr)}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedId && (
        <CampaignDetailsModal campaignId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-[oklch(0.7_0.18_162/0.2)] text-[oklch(0.7_0.18_162)]",
    PAUSED: "bg-[oklch(0.77_0.19_70/0.2)] text-[oklch(0.77_0.19_70)]",
    DELETED: "bg-destructive/20 text-destructive",
    ARCHIVED: "bg-muted text-muted-foreground",
    PENDING_REVIEW: "bg-chart-4/20 text-chart-4",
    DISAPPROVED: "bg-destructive/20 text-destructive",
    IN_PROCESS: "bg-primary/20 text-primary",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ============== ANÁLISE ==============
function Analise({
  camps,
  totals,
  loading,
  funnel,
  funnelLoading,
  breakdown,
  breakdownLoading,
  campConv,
  campConvLoading,
  onRefresh,
}: any) {
  // Funil real Meta: Impressão -> Click no link -> LPV -> ATC -> Checkout -> Purchase
  const f = funnel || {};
  const steps = [
    { label: "Impressões", value: f.impressions || totals.impressions, color: "from-primary to-chart-2" },
    { label: "Cliques no link", value: f.link_clicks || 0, color: "from-chart-2 to-chart-3" },
    { label: "Visualização da página (LPV)", value: f.landing_page_views || 0, color: "from-chart-3 to-chart-4" },
    { label: "Adicionou ao carrinho", value: f.add_to_cart || 0, color: "from-chart-4 to-chart-5" },
    { label: "Iniciou checkout", value: f.initiate_checkout || 0, color: "from-chart-5 to-[oklch(0.77_0.19_70)]" },
    { label: "Compras 💰", value: f.purchases || 0, color: "from-[oklch(0.7_0.18_162)] to-[oklch(0.7_0.18_162)]" },
  ];
  const maxStep = Math.max(...steps.map((s) => s.value), 1);

  const sells = (campConv as any[]).filter((c) => c.really_sells);
  const wastes = (campConv as any[]).filter((c) => c.spend > 20 && c.purchases === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Vende de verdade?</p>
          <p className="mt-2 text-2xl font-bold">
            {f.purchases > 0 && f.revenue > f.spend ? (
              <span className="text-[oklch(0.7_0.18_162)]">✅ SIM</span>
            ) : f.purchases > 0 ? (
              <span className="text-[oklch(0.77_0.19_70)]">⚠️ Vende mas no prejuízo</span>
            ) : (
              <span className="text-destructive">❌ Sem vendas</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNumber(f.purchases || 0)} compras · receita {formatBRL(f.revenue || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Custo por compra (real)</p>
          <p className="mt-2 text-2xl font-bold">{formatBRL(f.cost_per_purchase || 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">CPL: {formatBRL(f.cost_per_link_click || 0)} · CPLPV: {formatBRL(f.cost_per_lpv || 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversão Click→Compra</p>
          <p className="mt-2 text-2xl font-bold">
            {f.link_clicks > 0 ? ((f.purchases / f.link_clicks) * 100).toFixed(2) : "0.00"}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNumber(f.link_clicks || 0)} cliques · {formatNumber(f.purchases || 0)} compras
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeader
          title="Funil Real de Conversão"
          subtitle="Da impressão à compra — dados reais do Meta Pixel"
          loading={funnelLoading}
          onRefresh={onRefresh}
        />
        <div className="mt-4 space-y-3">
          {steps.map((s, i) => {
            const pct = (s.value / maxStep) * 100;
            const prev = i > 0 ? steps[i - 1].value : 0;
            const conversion = i > 0 && prev > 0 ? ((s.value / prev) * 100).toFixed(1) : null;
            const drop = i > 0 && prev > 0 ? (((prev - s.value) / prev) * 100).toFixed(1) : null;
            return (
              <div key={i}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{s.label}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatNumber(s.value)}</span>
                    {conversion && (
                      <span className="rounded bg-[oklch(0.7_0.18_162/0.15)] px-1.5 py-0.5 text-[oklch(0.7_0.18_162)]">
                        ↳ {conversion}%
                      </span>
                    )}
                    {drop && parseFloat(drop) > 50 && (
                      <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive">
                        −{drop}% caiu
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <SectionHeader
            title="Para onde foi o clique 🎯"
            subtitle="Breakdown por plataforma · posicionamento · dispositivo"
            loading={breakdownLoading}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Plataforma</th>
                <th className="px-4 py-3">Posicionamento</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3 text-right">Cliques</th>
                <th className="px-4 py-3 text-right">CTR</th>
                <th className="px-4 py-3 text-right">CPC</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Compras</th>
                <th className="px-4 py-3 text-right">CVR</th>
                <th className="px-4 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {breakdownLoading && breakdown.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={10} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted/50" /></td></tr>
                ))
              ) : breakdown.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sem dados de breakdown</td></tr>
              ) : (
                (breakdown as any[])
                  .sort((a, b) => b.spend - a.spend)
                  .map((b, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium capitalize">{b.publisher_platform}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.platform_position}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{b.impression_device}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(b.link_clicks)}</td>
                      <td className="px-4 py-3 text-right">{formatPct(b.ctr)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(b.cpc)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(b.spend)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(b.purchases)}</td>
                      <td className={`px-4 py-3 text-right ${b.cvr >= 1 ? "text-[oklch(0.7_0.18_162)]" : "text-muted-foreground"}`}>
                        {b.cvr.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${b.roas >= 2 ? "text-[oklch(0.7_0.18_162)]" : "text-[oklch(0.77_0.19_70)]"}`}>
                        {b.roas.toFixed(2)}x
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <SectionHeader
            title="Vende de verdade? — análise por campanha"
            subtitle={`${sells.length} vendendo no lucro · ${wastes.length} queimando dinheiro`}
            loading={campConvLoading}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Campanha</th>
                <th className="px-4 py-3 text-right">Cliques</th>
                <th className="px-4 py-3 text-right">LPV</th>
                <th className="px-4 py-3 text-right">ATC</th>
                <th className="px-4 py-3 text-right">Checkout</th>
                <th className="px-4 py-3 text-right">Compras</th>
                <th className="px-4 py-3 text-right">CVR</th>
                <th className="px-4 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-center">Vende?</th>
              </tr>
            </thead>
            <tbody>
              {campConvLoading && (campConv as any[]).length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted/50" /></td></tr>
                ))
              ) : (campConv as any[]).length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sem dados</td></tr>
              ) : (
                (campConv as any[])
                  .sort((a, b) => b.spend - a.spend)
                  .map((c) => (
                    <tr key={c.campaign_id} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                      <td className="max-w-xs truncate px-4 py-3 font-medium">{c.campaign_name}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(c.link_clicks)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(c.landing_page_views)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(c.add_to_cart)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(c.initiate_checkout)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(c.purchases)}</td>
                      <td className="px-4 py-3 text-right">{c.cvr_click_to_purchase.toFixed(2)}%</td>
                      <td className={`px-4 py-3 text-right font-semibold ${c.roas >= 2 ? "text-[oklch(0.7_0.18_162)]" : c.roas >= 1 ? "text-[oklch(0.77_0.19_70)]" : "text-destructive"}`}>
                        {c.roas.toFixed(2)}x
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.really_sells ? (
                          <span className="rounded-full bg-[oklch(0.7_0.18_162/0.2)] px-2 py-0.5 text-xs font-semibold text-[oklch(0.7_0.18_162)]">✅ SIM</span>
                        ) : c.purchases > 0 ? (
                          <span className="rounded-full bg-[oklch(0.77_0.19_70/0.2)] px-2 py-0.5 text-xs font-semibold text-[oklch(0.77_0.19_70)]">⚠️ Prejuízo</span>
                        ) : c.spend > 20 ? (
                          <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-semibold text-destructive">❌ Não</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightCard
          title="🚀 Top Performers"
          rows={[...camps].sort((a, b) => b.roas - a.roas).slice(0, 5)}
          type="top"
          loading={loading}
        />
        <InsightCard
          title="⚠️ Gargalos"
          rows={[...camps].filter((c) => c.spend > 0).sort((a, b) => a.roas - b.roas).slice(0, 5)}
          type="bottom"
          loading={loading}
        />
      </div>
    </div>
  );
}

function InsightCard({ title, rows, type, loading }: { title: string; rows: any[]; type: "top" | "bottom"; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <SectionHeader title={title} loading={loading} />
      <ul className="mt-4 space-y-2">
        {loading && rows.length === 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
          ))}
        {!loading && rows.length === 0 && <li className="text-sm text-muted-foreground">Sem dados.</li>}
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{formatBRL(c.spend)} gasto</p>
            </div>
            <span className={`text-sm font-bold ${type === "top" ? "text-[oklch(0.7_0.18_162)]" : "text-destructive"}`}>
              {c.roas.toFixed(2)}x
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============== CONTROLE ==============
function Controle({ camps, loading, onRefresh }: { camps: any[]; loading: boolean; onRefresh: () => void }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (vars: { campaignId: string; status: "ACTIVE" | "PAUSED" }) =>
      updateCampaignStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Status atualizado");
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
      } else {
        toast.error(res.error || "Falha ao atualizar");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <CreativeUpload />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <SectionHeader
            title="Controle de Campanhas"
            subtitle={`${camps.length} campanhas • pausar / ativar em tempo real`}
            loading={loading}
            onRefresh={onRefresh}
          />
        </div>
        <div className="divide-y divide-border">
          {loading && camps.length === 0 && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-12 animate-pulse rounded bg-muted/50" />
                </div>
              ))}
            </>
          )}
          {!loading && camps.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma campanha</div>
          )}
          {camps.map((c) => (
            <CampaignControlRow
              key={c.id}
              c={c}
              onToggle={(status) => toggle.mutate({ campaignId: c.id, status })}
              toggling={toggle.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignControlRow({
  c,
  onToggle,
  toggling,
}: {
  c: any;
  onToggle: (status: "ACTIVE" | "PAUSED") => void;
  toggling: boolean;
}) {
  const qc = useQueryClient();
  const isActive = (c.effective_status || c.status) === "ACTIVE";
  const currentBudget = c.daily_budget ? parseInt(c.daily_budget) / 100 : 0;
  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(currentBudget || 50);

  const saveBudget = useMutation({
    mutationFn: () =>
      updateBudget({
        data: { id: c.id, dailyBudgetCents: Math.round(budgetInput * 100), type: "campaign" },
      }),
    onSuccess: (res: any) => {
      if (res.ok) {
        toast.success(`Orçamento atualizado: ${formatBRL(budgetInput)}/dia`);
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        setEditing(false);
      } else {
        toast.error(res.error || "Falha ao atualizar orçamento (CBO ativo? edite no adset)");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteCampaign({ data: { campaignId: c.id } }),
    onSuccess: (res: any) => {
      if (res.ok) {
        toast.success("Campanha excluída!");
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
      } else {
        toast.error(res.error || "Erro ao excluir");
      }
    },
  });

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <button
          onClick={() => setShowDetails(true)}
          className="block max-w-full truncate text-left font-medium hover:text-primary hover:underline"
          title="Ver criativos e detalhes"
        >
          {c.name}
        </button>
        <p className="text-xs text-muted-foreground">
          {c.objective} • {formatBRL(c.spend)} gasto • ROAS {c.roas.toFixed(2)}x
          {currentBudget > 0 && ` • Budget ${formatBRL(currentBudget)}/dia`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowDetails(true)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          title="Ver criativos, adsets e métricas"
        >
          <Eye className="h-3 w-3" /> Detalhes
        </button>
        <StatusBadge status={c.effective_status || c.status} />

        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">R$</span>
            <input
              type="number"
              value={budgetInput}
              min={1}
              step={1}
              onChange={(e) => setBudgetInput(parseFloat(e.target.value || "0"))}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => saveBudget.mutate()}
              disabled={saveBudget.isPending || budgetInput < 1}
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saveBudget.isPending ? "…" : "Salvar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              💰 Editar budget
            </button>
            <select
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-medium hover:bg-accent focus:outline-none"
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                
                let newBudget: number;
                if (val.startsWith("fixed:")) {
                  newBudget = parseInt(val.split(":")[1]);
                } else {
                  const factor = parseFloat(val);
                  newBudget = Math.round(currentBudget * factor * 100);
                }

                if (newBudget < 100) {
                  toast.error("Budget mínimo R$ 1,00");
                  return;
                }
                
                toast.promise(
                  updateBudget({
                    data: { id: c.id, dailyBudgetCents: newBudget, type: "campaign" },
                  }).then((res: any) => {
                    if (!res.ok) throw new Error(res.error || "Erro ao escalar");
                    qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
                    return res;
                  }),
                  {
                    loading: "Escalando...",
                    success: `Budget alterado para ${formatBRL(newBudget / 100)}`,
                    error: (err) => err.message,
                  }
                );
                e.target.value = "";
              }}
            >
              <option value="">🚀 Escala</option>
              <option value="1.2">+20% (Vertical)</option>
              <option value="1.5">+50% (Agressiva)</option>
              <option value="2.0">Dobrar (x2)</option>
              <option value="0.8">-20% (Reduzir)</option>
              <option value="0.5">Metade (x0.5)</option>
              <optgroup label="Presets Estratégia">
                {SCALE_STRATEGIES.map((s) => (
                  <option key={s.id} value={`fixed:${s.defaults.dailyBudgetCents}`}>
                    {s.emoji} {s.name} ({formatBRL(s.defaults.dailyBudgetCents / 100)})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {isActive ? (
          <button
            onClick={() => onToggle("PAUSED")}
            disabled={toggling}
            className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.77_0.19_70/0.2)] px-3 py-1.5 text-xs font-medium text-[oklch(0.77_0.19_70)] hover:bg-[oklch(0.77_0.19_70/0.3)] disabled:opacity-50"
          >
            <Pause className="h-3 w-3" /> Pausar
          </button>
        ) : (
          <button
            onClick={() => onToggle("ACTIVE")}
            disabled={toggling}
            className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.7_0.18_162/0.2)] px-3 py-1.5 text-xs font-medium text-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.7_0.18_162/0.3)] disabled:opacity-50"
          >
            <Play className="h-3 w-3" /> Ativar
          </button>
        )}

        <button
          onClick={() => {
            if (confirm(`Tem certeza que deseja excluir permanentemente a campanha "${c.name}"?`)) {
              deleteMut.mutate();
            }
          }}
          disabled={deleteMut.isPending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          title="Excluir campanha"
        >
          {deleteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      {showDetails && (
        <CampaignDetailsModal campaignId={c.id} onClose={() => setShowDetails(false)} />
      )}
    </div>
  );
}


function CreativeUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [briefing, setBriefing] = useState("");
  const [generated, setGenerated] = useState<any>(null);

  const gen = useMutation({
    mutationFn: () => generateAdCopy({ data: { briefing, tone: "direto" } }),
    onSuccess: (res) => {
      if (res.ok) {
        setGenerated(res.parsed || { raw: res.raw });
        toast.success("Copy gerado com IA");
      } else {
        toast.error(res.error || "Falha");
      }
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Upload de Criativos + IA Copy</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">Anexar mídia</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center hover:bg-muted/50">
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Imagens / Vídeos / Carrossel</span>
            <span className="mt-1 text-xs text-muted-foreground">Clique para selecionar</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {files.map((f, i) => (
                <li key={i} className="truncate rounded bg-muted/40 px-2 py-1">📎 {f.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">Briefing</label>
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="Ex: curso de inglês online, público 25-45, dor: medo de falar em público…"
            rows={5}
            className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => gen.mutate()}
            disabled={!briefing.trim() || gen.isPending}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {gen.isPending ? "Gerando…" : "Gerar copy com IA"}
          </button>
        </div>
      </div>

      {generated && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Variações sugeridas</h4>
          {generated.variations ? (
            <div className="space-y-3">
              {generated.variations.map((v: any, i: number) => (
                <div key={i} className="rounded-md bg-card p-3 text-sm">
                  <p className="font-bold">{v.headline}</p>
                  <p className="mt-1 text-muted-foreground">{v.primary}</p>
                  <p className="mt-1 text-xs">📞 {v.cta}</p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-xs">{generated.raw}</pre>
          )}
        </div>
      )}
    </div>
  );
}

// ============== ESCALAS ==============
function Escalas({ camps, campConv }: { camps: any[]; campConv: any[] }) {
  const [active, setActive] = useState<ScaleStrategy | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState<{ preselected?: string } | null>(null);

  const recommendations = useMemo(
    () => generateRecommendations(campConv, camps, { roasTarget: 2, cpaTarget: 10 }),
    [campConv, camps],
  );

  const opportunities = recommendations.filter((r) => r.severity === "opportunity");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-chart-4/10 to-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">Iniciar Campanha pelo Modelo</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma campanha que você já tem na dashboard e a Dashboard sobe a cópia
              <strong className="text-foreground"> automaticamente </strong>
              com todas as características do modelo (objetivo, buying type, bid strategy, budget).
            </p>
          </div>
          <button
            onClick={() => setDuplicateOpen({})}
            disabled={camps.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Escolher modelo & subir
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-chart-4/10 p-5">
        <h3 className="text-sm font-semibold">📋 Estratégias prontas (campanha do zero)</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ou crie uma campanha nova a partir das estratégias abaixo. Regra: pause se CPA &gt; R$10.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCALE_STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.color}`} />
            <div className="flex items-start justify-between">
              <div className="text-3xl">{s.emoji}</div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="mt-3 text-base font-bold">{s.name}</h4>
            <p className="mt-2 text-xs text-muted-foreground">{s.shortDesc}</p>
          </button>
        ))}
      </div>

      {opportunities.length > 0 && (
        <div className="mt-12">
          <RecommendationsPanel
            recommendations={opportunities}
            camps={camps}
            campConv={campConv}
          />
        </div>
      )}

      {active && (
        <ScaleModal
          strategy={active}
          onClose={() => setActive(null)}
          camps={camps}
          campConv={campConv}
        />
      )}
      {duplicateOpen && (
        <DuplicateCampaignModal
          camps={camps}
          campConv={campConv}
          preselectedId={duplicateOpen.preselected}
          onClose={() => setDuplicateOpen(null)}
        />
      )}
    </div>
  );
}

// ============== DUPLICATE CAMPAIGN MODAL ==============
function DuplicateCampaignModal({
  camps,
  campConv,
  onClose,
  preselectedId,
}: {
  camps: any[];
  campConv: any[];
  onClose: () => void;
  preselectedId?: string;
}) {
  const qc = useQueryClient();
  const [sourceId, setSourceId] = useState<string>(preselectedId || camps[0]?.id || "");
  const source = camps.find((c) => c.id === sourceId);
  const sourceConv = campConv.find((c) => c.campaign_id === sourceId);

  const currentBudget = source?.daily_budget ? parseInt(source.daily_budget) / 100 : 50;
  const [name, setName] = useState(
    source ? `${source.name} — cópia ${new Date().toLocaleDateString("pt-BR")}` : "",
  );
  const [budget, setBudget] = useState(currentBudget);
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("PAUSED");

  // sincroniza budget/nome quando troca o source
  const onChangeSource = (id: string) => {
    setSourceId(id);
    const s = camps.find((c) => c.id === id);
    if (s) {
      setBudget(s.daily_budget ? parseInt(s.daily_budget) / 100 : 50);
      setName(`${s.name} — cópia ${new Date().toLocaleDateString("pt-BR")}`);
    }
  };

  const dup = useMutation({
    mutationFn: () =>
      duplicateCampaign({
        data: {
          sourceCampaignId: sourceId,
          newName: name || undefined,
          dailyBudgetCents: Math.round(budget * 100),
          status,
        },
      }),
    onSuccess: (res: any) => {
      if (res.ok) {
        toast.success(`✅ Campanha duplicada do modelo "${res.clonedFrom?.name}"`);
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        onClose();
      } else {
        toast.error(res.error || "Falha ao duplicar");
      }
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-3xl">🚀</div>
            <h3 className="mt-2 text-xl font-bold">Iniciar campanha pelo modelo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o modelo. Vamos clonar com objetivo + buying type + bid strategy + budget.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
              Modelo (campanha existente)
            </label>
            <select
              value={sourceId}
              onChange={(e) => onChangeSource(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.effective_status || c.status) === "ACTIVE" ? "🟢 " : "⏸️ "}
                  {c.name} · ROAS {(c.roas ?? 0).toFixed(2)}x
                </option>
              ))}
            </select>
          </div>

          {source && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Características que serão clonadas
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Objetivo</span>
                  <p className="font-medium">{source.objective || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Buying Type</span>
                  <p className="font-medium">{source.buying_type || "AUCTION"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Bid Strategy</span>
                  <p className="font-medium">{source.bid_strategy || "automática"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Budget atual</span>
                  <p className="font-medium">{formatBRL(currentBudget)}/dia</p>
                </div>
                {sourceConv && (
                  <>
                    <div>
                      <span className="text-xs text-muted-foreground">Performance modelo</span>
                      <p className="font-medium">
                        ROAS {sourceConv.roas?.toFixed(2)}x · {sourceConv.purchases} compras
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CVR Click→Compra</span>
                      <p className="font-medium">{sourceConv.cvr_click_to_purchase?.toFixed(2)}%</p>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-3 rounded bg-primary/10 p-2 text-xs text-primary">
                ℹ️ Adsets, criativos e públicos NÃO são copiados pela Graph API neste passo (Meta exige
                duplicação ad-a-ad). A campanha-mãe será criada com os mesmos parâmetros para você anexar
                criativos no painel Meta ou via aba Controle.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
              Nome da nova campanha
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                Budget diário (R$)
              </label>
              <input
                type="number"
                value={budget}
                min={1}
                onChange={(e) => setBudget(parseFloat(e.target.value || "0"))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                Status inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PAUSED">Pausada (revisar antes)</option>
                <option value="ACTIVE">Ativa imediatamente</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => dup.mutate()}
          disabled={!sourceId || dup.isPending || budget < 1}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-chart-4 px-4 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
        >
          {dup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {dup.isPending ? "Subindo via API…" : "🚀 Subir cópia via API"}
        </button>
      </div>
    </div>
  );
}

// Playbook por estratégia: passos práticos pós-criação
const SCALE_PLAYBOOKS: Record<string, { audience: string; creatives: string; postLaunch: string[]; killRule: string; scaleRule: string }> = {
  abo: {
    audience: "1 público por adset (interesses específicos OU lookalike 1-3%). Não misture.",
    creatives: "3 a 5 criativos por adset, formatos variados (estático, carrossel, vídeo).",
    postLaunch: ["Aguarde 48h sem mexer (fase de aprendizado)", "Pause adsets com CPA > meta após 50 impressões/conversões", "Em winners (ROI ≥ 2): +20–30%/dia"],
    killRule: "CPA > R$10 OU ROAS < 1 após 48h",
    scaleRule: "+20–30% por dia mantendo ROAS estável",
  },
  cbo: {
    audience: "3 a 5 adsets dentro da MESMA campanha. Mix de lookalike + interesses + amplo.",
    creatives: "Pelo menos 3 criativos por adset. A IA do Meta vai escolher os melhores.",
    postLaunch: ["Não pause adsets nas primeiras 72h", "Após 50 conversões/campanha: +20% a cada 3 dias", "Refresh criativo a cada 7-14 dias"],
    killRule: "Campanha inteira com ROAS < 1 após 72h e 50+ impressões/adset",
    scaleRule: "+20% a cada 3 dias enquanto ROAS estiver acima da meta",
  },
  "111": {
    audience: "1 público amplo OU 1 interesse de teste. Nada de stack.",
    creatives: "1 único criativo. Esse é o teste — quer saber se ELE funciona.",
    postLaunch: ["Avalie em 24-48h", "Se bater meta: duplique o adset variando criativo", "Se falhar: mate e teste outro criativo"],
    killRule: "Sem conversões em 48h com 1.000+ impressões",
    scaleRule: "Duplicar (não escalar verba) — escalar via horizontal",
  },
  baiana: {
    audience: "Públicos amplos (Brasil 18-65, sem interesse). Deixa o algoritmo trabalhar.",
    creatives: "50 criativos diferentes (1 por adset). Testagem em massa.",
    postLaunch: ["Após 24h: pause os com ROI < 2", "Mantenha os winners (ROI ≥ 2)", "Replique winners até 250 adsets"],
    killRule: "Adset com ROI < 2 após 24h e R$7 gastos",
    scaleRule: "Replicar adsets winners (não aumentar verba do mesmo)",
  },
  russa: {
    audience: "Públicos narrow (interesses específicos, lookalike 1%). Qualidade > quantidade.",
    creatives: "2-3 criativos testados, com histórico positivo de ROAS.",
    postLaunch: ["Aumente +20-30%/dia somente se ROAS estável", "Se ROAS cair: volte ao orçamento anterior", "Monitore frequência (alerta se > 3)"],
    killRule: "ROAS cair >20% após aumento de verba",
    scaleRule: "+20–30% por dia, conservador",
  },
  vertical: {
    audience: "Mantenha o público que JÁ está performando (não troque).",
    creatives: "Mantenha os criativos vencedores. Adicione 1-2 novos a cada semana.",
    postLaunch: ["Aumente +20-30%/dia somente após 7 dias de ROAS estável", "Se freq > 3: adicione novo criativo", "Não aumente verba 2 dias seguidos sem dado"],
    killRule: "ROAS cair >25% após aumento",
    scaleRule: "+20–30% por dia, regra dos 20%",
  },
  horizontal: {
    audience: "Replicar adset winner para 2-3 novos públicos (lookalikes diferentes, interesses correlatos).",
    creatives: "Mesmo criativo vencedor + 1-2 variações por novo adset.",
    postLaunch: ["Avalie cada novo adset em 48h", "Mantenha os que bateram ROAS meta", "Mate o resto sem dó"],
    killRule: "Novo adset com ROAS < meta após 48h",
    scaleRule: "Adicionar mais adsets/criativos (não verba)",
  },
  bitcamp: {
    audience: "Públicos amplos (Brasil 18-65). Velocidade de teste.",
    creatives: "3-5 criativos agressivos por adset. Hooks fortes nos primeiros 3s.",
    postLaunch: ["Em 24h: avalie tudo", "Pause losers (CPA acima da meta)", "Winners: migrar para CBO conservador"],
    killRule: "CPA 2x acima da meta em 24h",
    scaleRule: "Migrar winners para escala estável (CBO/Russa)",
  },
  andromeda: {
    audience: "Lookalikes 1-3% + exclusões de quem já comprou.",
    creatives: "3-5 criativos com refresh semanal obrigatório.",
    postLaunch: ["Cheque ROAS e frequência a cada 3-4 dias", "Se ROAS > 2.5x e freq < 3: +20%", "Se freq ≥ 3: refresh criativo antes de escalar"],
    killRule: "ROAS < 2 OU frequência ≥ 4",
    scaleRule: "+20% a cada 3-4 dias condicional a ROAS+freq",
  },
  ia_opt: {
    audience: "Mantenha os públicos que já estão com ROAS > Target.",
    creatives: "Refresh criativo somente se a frequência subir acima de 3.",
    postLaunch: ["Aplique as recomendações de 'Oportunidade' da Dashboard", "Acompanhe o impacto estimado no painel de Auditoria", "Mantenha o budget se o ROAS projetado for saudável"],
    killRule: "ROAS real cair abaixo de 1.5x por 3 dias seguidos",
    scaleRule: "Seguir a sugestão da IA (+20% a +50% dependendo do ROAS)",
  },
};

function ScaleModal({
  strategy,
  onClose,
  camps,
  campConv,
}: {
  strategy: ScaleStrategy;
  onClose: () => void;
  camps: any[];
  campConv: any[];
}) {
  const playbook = SCALE_PLAYBOOKS[strategy.id] ?? SCALE_PLAYBOOKS.abo;
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const recommendations = useMemo(
    () => (strategy.id === "ia_opt" ? generateRecommendations(campConv, camps) : []),
    [campConv, camps, strategy.id],
  );
  const bestRec = recommendations.find((r) => r.severity === "opportunity" && r.action === "INCREASE_BUDGET");

  const [name, setName] = useState(`${strategy.defaults.namePrefix} - ${new Date().toLocaleDateString("pt-BR")}`);
  const [budget, setBudget] = useState(strategy.defaults.dailyBudgetCents / 100);
  const [objective, setObjective] = useState(strategy.defaults.objective);
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">(strategy.defaults.status);

  // Auto-fill logic for IA Otimizada
  useEffect(() => {
    if (strategy.id === "ia_opt" && bestRec) {
      if (bestRec.suggestedDailyBudgetCents) {
        setBudget(bestRec.suggestedDailyBudgetCents / 100);
      }
      setName(`ESCALA IA: ${bestRec.campaignName}`);
    }
  }, [strategy.id, bestRec]);

  // Alocação de criativos por slot (conforme a estratégia pede)
  const creativeCount = strategy.creativeCount || 3;
  const [creativeSlots, setCreativeSlots] = useState<Array<{
    file: boolean;
    primaryText: boolean;
    headline: boolean;
    cta: boolean;
  }>>(Array(creativeCount).fill(null).map(() => ({
    file: false,
    primaryText: false,
    headline: false,
    cta: false,
  })));

  const toggleCreativeField = (index: number, field: keyof typeof creativeSlots[0]) => {
    setCreativeSlots(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  // Checklist do passo "criativos"
  const [chk, setChk] = useState<Record<string, boolean>>({
    publico: false,
    criativo: false,
    pixel: false,
    orcamento: false,
  });

  // Efeito para marcar o checklist de criativos automaticamente quando TODOS os slots estiverem prontos
  useEffect(() => {
    const allSlotsReady = creativeSlots.every(s => s.file && s.primaryText && s.headline && s.cta);
    if (allSlotsReady && !chk.criativo) {
      setChk(c => ({ ...c, criativo: true }));
      toast.success("✅ Todos os criativos foram alocados!");
    } else if (!allSlotsReady && chk.criativo) {
      setChk(c => ({ ...c, criativo: false }));
    }
  }, [creativeSlots, chk.criativo]);

  const [applyBestTargeting, setApplyBestTargeting] = useState(true);

  const allChecked = Object.values(chk).every(Boolean);


  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      if (strategy.id === "ia_opt" && bestRec) {
        const res = await duplicateCampaign({
          data: {
            sourceCampaignId: bestRec.campaignId,
            newName: name,
            dailyBudgetCents: Math.round(budget * 100),
            status,
          },
        });
        if (!res.ok) return res;
        return { ok: true as const, data: res.data, strategy: strategy.id };
      }
      return createCampaign({
        data: {
          name,
          objective,
          status,
          dailyBudgetCents: Math.round(budget * 100),
          strategy: strategy.id,
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`✅ Campanha "${name}" enviada via API com sucesso!`);
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        setStep(5);
      } else {
        toast.error(res.error || "Erro ao processar escala via API");
      }
    },
  });

  const healthData = useMemo(() => {
    if (!bestRec) return null;
    const conv = campConv.find((c) => c.campaign_id === bestRec.campaignId);
    if (!conv) return null;

    const roasScore = Math.min(100, (conv.roas / 2) * 100);
    const ctrScore = Math.min(100, (conv.ctr / 1) * 100);
    const cvrScore = Math.min(100, (conv.cvr_click_to_purchase / 2) * 100);

    const overall = roasScore * 0.5 + ctrScore * 0.3 + cvrScore * 0.2;

    return {
      overall: Math.round(overall),
      roas: conv.roas,
      ctr: conv.ctr,
      cvr: conv.cvr_click_to_purchase,
      isHealthy: overall > 70,
    };
  }, [bestRec, campConv]);

  const stepLabels = ["Entender", "Configurar", "Checklist", "Revisar & Subir", "Pós-launch"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{strategy.emoji}</div>
            <div>
              <h3 className="text-xl font-bold">{strategy.name}</h3>
              <p className="text-xs text-muted-foreground">Tutorial guiado · passo {step} de {totalSteps}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Stepper */}
        <div className="mb-5 flex items-center gap-1">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <div key={n} className="flex flex-1 items-center gap-1">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? `bg-gradient-to-r ${strategy.color} text-white`
                      : current
                        ? "border-2 border-primary bg-background text-primary"
                        : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : n}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-0.5 flex-1 ${done ? `bg-gradient-to-r ${strategy.color}` : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mb-5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {stepLabels[step - 1]}
        </div>

        {/* STEP 1 — Entender */}
        {step === 1 && (
          <div className="space-y-4">
            <div className={`rounded-lg bg-gradient-to-br ${strategy.color} p-4 text-white`}>
              <p className="text-sm leading-relaxed">{strategy.fullDesc}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Regra de escala</p>
                <p className="mt-1 text-sm">{playbook.scaleRule}</p>
              </div>
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-[10px] font-semibold uppercase text-destructive">Regra de kill</p>
                <p className="mt-1 text-sm">{playbook.killRule}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              💡 Esse passo é só pra você entender a lógica antes de gastar verba. Sem pressa.
            </div>
          </div>
        )}

        {/* STEP 2 — Configurar */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Nome da campanha</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Use prefixo padrão pra organizar (ex: {strategy.defaults.namePrefix} - data).</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Orçamento diário (R$)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value || "0"))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Sugerido: R$ {(strategy.defaults.dailyBudgetCents / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Status inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PAUSED">Pausada (recomendado)</option>
                  <option value="ACTIVE">Ativa (sobe rodando)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Objetivo</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="OUTCOME_SALES">Vendas</option>
                <option value="OUTCOME_LEADS">Leads</option>
                <option value="OUTCOME_ENGAGEMENT">Engajamento</option>
                <option value="OUTCOME_TRAFFIC">Tráfego</option>
                <option value="OUTCOME_AWARENESS">Reconhecimento</option>
                <option value="OUTCOME_APP_PROMOTION">App</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3 — Checklist (público / criativo / pixel) */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Marque quando estiver pronto. Tudo precisa estar ✓ pra subir com chance real de bater meta.</p>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-bold">
                  <Upload className="h-4 w-4" /> Alocação de Criativos ({creativeCount} slots)
                </h4>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">
                  {creativeSlots.filter(s => s.file && s.primaryText && s.headline && s.cta).length} / {creativeCount} prontos
                </div>
              </div>

              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
                {creativeSlots.map((slot, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-card/50 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Criativo #{idx + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => toggleCreativeField(idx, "file")}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${slot.file ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${slot.file ? "bg-primary text-white" : "border-border"}`}>
                          {slot.file ? "✓" : ""}
                        </div>
                        {slot.file ? (
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <ImageIcon className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate text-[10px] font-semibold">Alocado</span>
                          </div>
                        ) : (
                          <p className="truncate text-xs font-bold">Mídia</p>
                        )}
                      </button>

                      <button 
                        onClick={() => toggleCreativeField(idx, "primaryText")}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${slot.primaryText ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${slot.primaryText ? "bg-primary text-white" : "border-border"}`}>
                          {slot.primaryText ? "✓" : ""}
                        </div>
                        <p className="truncate text-xs font-bold">Texto</p>
                      </button>

                      <button 
                        onClick={() => toggleCreativeField(idx, "headline")}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${slot.headline ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${slot.headline ? "bg-primary text-white" : "border-border"}`}>
                          {slot.headline ? "✓" : ""}
                        </div>
                        <p className="truncate text-xs font-bold">Título</p>
                      </button>

                      <button 
                        onClick={() => toggleCreativeField(idx, "cta")}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${slot.cta ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${slot.cta ? "bg-primary text-white" : "border-border"}`}>
                          {slot.cta ? "✓" : ""}
                        </div>
                        <p className="truncate text-xs font-bold">CTA</p>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground italic">
                💡 Este é um tutorial guiado. Para habilitar o checklist de criativos, você deve alocar todos os {creativeCount} criativos solicitados pelo modelo {strategy.name}.
              </p>
            </div>
            
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={applyBestTargeting} 
                  onChange={e => setApplyBestTargeting(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-xs font-bold">Otimizar Público (Retail/E-commerce)</span>
              </label>
              <p className="mt-1 text-[10px] text-muted-foreground ml-6">
                Inclui "Compradores Envolvidos" e interesses em "Online Shopping" para maximizar ROAS.
              </p>
            </div>

            <div className="space-y-2">
              <ChecklistItem
                checked={chk.publico}
                onToggle={() => setChk((c) => ({ ...c, publico: !c.publico }))}
                title="Público definido"
                hint={playbook.audience}
              />
              <ChecklistItem
                checked={chk.criativo}
                onToggle={() => setChk((c) => ({ ...c, criativo: !c.criativo }))}
                title="Criativos prontos"
                hint={playbook.creatives}
              />
              <ChecklistItem
                checked={chk.pixel}
                onToggle={() => setChk((c) => ({ ...c, pixel: !c.pixel }))}
                title="Pixel/CAPI funcionando"
                hint="Confirme eventos de Purchase/Lead chegando no Events Manager nas últimas 24h."
              />
              <ChecklistItem
                checked={chk.orcamento}
                onToggle={() => setChk((c) => ({ ...c, orcamento: !c.orcamento }))}
                title="Orçamento de teste reservado"
                hint={`Reserve pelo menos 7x o orçamento diário (R$ ${(budget * 7).toFixed(2)}) pra ter dado estatístico.`}
              />
            </div>

            {!allChecked && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                ⚠️ Subir sem checklist completo costuma queimar verba. Termine antes de avançar.
              </div>
            )}
          </div>
        )}


        {step === 4 && strategy.id === "ia_opt" && !bestRec && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-amber-200">Nenhum vencedor absoluto ainda</h4>
            <p className="mt-2 text-sm text-amber-200/80">
              A IA ainda não identificou uma campanha com ROAS e volume suficientes para uma escala segura de "IA Otimizada". 
              Continue rodando seus testes ou use as estratégias ABO/CBO manuais.
            </p>
            <button 
              onClick={() => setStep(1)}
              className="mt-4 text-xs font-bold underline hover:text-amber-100"
            >
              Escolher outra estratégia
            </button>
          </div>
        )}

        {/* STEP 4 — Revisar & Subir (Com Winner) */}
        {step === 4 && (strategy.id !== "ia_opt" || bestRec) && (
          <div className="space-y-4">
            {strategy.id === "ia_opt" && bestRec && healthData && (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Verificação de Saúde da Escala
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${healthData.isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {healthData.isHealthy ? 'PROBABILIDADE ALTA DE VENDAS' : 'PROBABILIDADE MÉDIA'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-background/50 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Score Geral</p>
                      <p className={`text-xl font-bold ${healthData.overall > 80 ? 'text-emerald-400' : 'text-primary'}`}>{healthData.overall}%</p>
                    </div>
                    <div className="bg-background/50 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">ROAS Atual</p>
                      <p className="text-xl font-bold">{healthData.roas.toFixed(2)}x</p>
                    </div>
                    <div className="bg-background/50 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">CTR</p>
                      <p className="text-xl font-bold">{healthData.ctr.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>Campanha vencedora identificada: <strong>{bestRec.campaignName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>Público validado com ROI {healthData.roas.toFixed(2)}x</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>Criativos com CTR saudável ({healthData.ctr.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Preview da Escala Automática</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ação IA:</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Escalar Winner
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novo Budget sugerido:</span>
                      <span className="font-bold text-foreground">R$ {budget.toFixed(2)}/dia</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium text-foreground">Duplicação com Otimização API</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {strategy.id !== "ia_opt" && (
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Resumo</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estratégia</span><span className="font-medium">{strategy.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Objetivo</span><span className="font-medium">{objective}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Orçamento/dia</span><span className="font-medium">R$ {budget.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{status}</span></div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || (strategy.id === "ia_opt" && !bestRec)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r ${strategy.color} px-4 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50`}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {create.isPending ? "Processando via API…" : strategy.id === "ia_opt" ? "🚀 EXECUTAR ESCALA IA" : "🚀 SUBIR via API"}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">Após subir, te mostro o playbook pós-launch.</p>
          </div>
        )}

        {/* STEP 5 — Playbook pós-launch */}
        {step === 5 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              ✅ Campanha no ar. Agora siga esse playbook nos próximos dias:
            </div>
            <ol className="space-y-2">
              {playbook.postLaunch.map((p, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r ${strategy.color} text-xs font-bold text-white`}>{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <p className="font-semibold text-destructive">Kill se:</p>
                <p className="mt-1 text-foreground">{playbook.killRule}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs">
                <p className="font-semibold text-emerald-300">Escala se:</p>
                <p className="mt-1 text-foreground">{playbook.scaleRule}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
          >
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 3 && !allChecked}
              className={`rounded-md bg-gradient-to-r ${strategy.color} px-5 py-2 text-xs font-bold text-white shadow disabled:opacity-50`}
            >
              Avançar →
            </button>
          )}
          {step === 5 && (
            <button
              onClick={onClose}
              className={`rounded-md bg-gradient-to-r ${strategy.color} px-5 py-2 text-xs font-bold text-white shadow`}
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ checked, onToggle, title, hint }: { checked: boolean; onToggle: () => void; title: string; hint: string }) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
        checked ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
          checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground"
        }`}
      >
        {checked && "✓"}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
    </button>
  );
}

// ============== APIs / IA ==============
function IATab() {
  const [apis, setApis] = useState<CustomApi[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setApis(loadCustomApis());
  }, []);

  const refresh = () => setApis(loadCustomApis());

  const prompts = [
    { title: "Imagem (Midjourney)", body: "/imagine cinematic product photo of [PRODUTO], golden hour, ultra detailed, 35mm, --ar 4:5" },
    { title: "Música/VSL (Suno)", body: "Upbeat brazilian funk pop, 90 bpm, motivational hook for [PRODUTO], 30s" },
    { title: "Roteiro VSL (IA)", body: "Roteiro de 30s para Reels: gancho 3s, problema, solução [PRODUTO], CTA forte" },
    { title: "Headline (IA)", body: "Gere 10 headlines de Meta Ads para [PRODUTO] focado em [DOR]" },
  ];

  return (
    <div className="space-y-6">
      {/* APIs Personalizadas */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> APIs personalizadas
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Conecte qualquer API externa (CRM, Webhook, ZeroBounce, OpenAI extra, n8n, Make…) e use direto na dashboard
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" /> {showForm ? "Cancelar" : "Adicionar API"}
          </button>
        </div>

        {showForm && (
          <div className="border-b border-border p-5">
            <CustomApiForm
              onSaved={() => {
                refresh();
                setShowForm(false);
              }}
            />
          </div>
        )}

        <div className="divide-y divide-border">
          {apis.length === 0 && !showForm && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma API cadastrada ainda. Clique em "Adicionar API" para conectar a primeira.
            </div>
          )}
          {apis.map((a) => (
            <CustomApiRow
              key={a.id}
              api={a}
              onRemoved={refresh}
            />
          ))}
        </div>
      </div>

      {/* Gerador de Link WhatsApp */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.7_0.18_162/0.2)] text-[oklch(0.7_0.18_162)]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Gerador de Link WhatsApp (x1)</h3>
            <p className="text-xs text-muted-foreground">Crie links diretos para usar em seus anúncios e vender no um-a-um</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Seu Número</label>
              <input 
                type="text" 
                placeholder="5511999999999"
                defaultValue={localStorage.getItem("whatsapp_number") || ""}
                onChange={(e) => localStorage.setItem("whatsapp_number", e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Mensagem Inicial (Opcional)</label>
              <textarea 
                id="wa-msg"
                placeholder="Olá, vim do anúncio e quero saber mais sobre o produto!"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-20"
              />
            </div>
          </div>
          
          <div className="flex flex-col justify-end gap-2">
            <button
              onClick={() => {
                const num = localStorage.getItem("whatsapp_number") || "";
                const msg = (document.getElementById("wa-msg") as HTMLTextAreaElement)?.value || "";
                if (!num) return toast.error("Preencha seu número");
                const url = `https://wa.me/${num}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
                navigator.clipboard.writeText(url);
                toast.success("Link do WhatsApp copiado!");
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[oklch(0.7_0.18_162)] px-4 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              Gerar & Copiar Link Direto
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              💡 Use este link como URL de destino em suas campanhas de "Tráfego" ou "Vendas" para levar o lead direto para o seu WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Docs Meta */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">📚 Meta Graph API v21.0</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta dashboard consome diretamente a Graph API do Meta para listar contas, campanhas, criar campanhas, pausar/ativar e
          puxar insights. Documentação:
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          <li><a className="text-primary hover:underline" href="https://developers.facebook.com/docs/marketing-apis/" target="_blank" rel="noreferrer">Marketing API</a></li>
          <li><a className="text-primary hover:underline" href="https://developers.facebook.com/docs/marketing-api/insights" target="_blank" rel="noreferrer">Insights</a></li>
          <li><a className="text-primary hover:underline" href="https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group" target="_blank" rel="noreferrer">Campaign Reference</a></li>
        </ul>
      </div>

      {/* Prompts IA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {prompts.map((p, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-2 text-sm font-semibold">{p.title}</h4>
            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">{p.body}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(p.body);
                toast.success("Prompt copiado!");
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-3 w-3" /> Copiar prompt
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomApiForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<CustomApi["authType"]>("bearer");
  const [authKey, setAuthKey] = useState("");
  const [authValue, setAuthValue] = useState("");
  const [defaultPath, setDefaultPath] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim() || !baseUrl.trim()) {
      toast.error("Nome e URL base são obrigatórios");
      return;
    }
    addCustomApi({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      authType,
      authKey: authKey.trim() || undefined,
      authValue: authValue.trim() || undefined,
      defaultPath: defaultPath.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast.success("API adicionada!");
    onSaved();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome da API">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: ZeroBounce, n8n Webhook, OpenAI…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Field>
      <Field label="URL base">
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.exemplo.com/v1"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Field>
      <Field label="Tipo de autenticação">
        <select
          value={authType}
          onChange={(e) => setAuthType(e.target.value as CustomApi["authType"])}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="none">Nenhuma</option>
          <option value="bearer">Bearer token (Authorization)</option>
          <option value="header">Header customizado (ex: X-API-Key)</option>
          <option value="query">Query param (ex: ?api_key=…)</option>
        </select>
      </Field>
      {authType !== "none" && (
        <>
          {(authType === "header" || authType === "query") && (
            <Field label={authType === "header" ? "Nome do header" : "Nome do query param"}>
              <input
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                placeholder={authType === "header" ? "X-API-Key" : "api_key"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>
          )}
          <Field label="Token / Chave">
            <input
              value={authValue}
              onChange={(e) => setAuthValue(e.target.value)}
              type="password"
              placeholder="••••••••••••••••"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
        </>
      )}
      <Field label="Endpoint padrão (opcional)">
        <input
          value={defaultPath}
          onChange={(e) => setDefaultPath(e.target.value)}
          placeholder="/contacts ou /webhook/abc123"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Field>
      <Field label="Notas (opcional)">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Para que serve esta API?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <button
          onClick={submit}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Salvar API
        </button>
      </div>
      <p className="sm:col-span-2 text-xs text-muted-foreground">
        🔒 As chaves ficam armazenadas apenas no seu navegador (localStorage). Nunca são enviadas a outros servidores.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function CustomApiRow({ api, onRemoved }: { api: CustomApi; onRemoved: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [pathOverride, setPathOverride] = useState(api.defaultPath || "");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ ok: boolean; status: number; data: any; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);
    try {
      const r = await testCustomApi(api, pathOverride, method, body);
      setResult(r);
      if (r.ok) toast.success(`✓ ${r.status} OK`);
      else toast.error(`✗ ${r.status} — ${r.error || "falhou"}`);
    } finally {
      setTesting(false);
    }
  };

  const remove = () => {
    if (confirm(`Remover a API "${api.name}"?`)) {
      removeCustomApi(api.id);
      toast.success("API removida");
      onRemoved();
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium">{api.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {api.baseUrl}
            {api.notes && ` • ${api.notes}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            🔐 {api.authType === "none" ? "Sem auth" : api.authType === "bearer" ? "Bearer" : `${api.authType}: ${api.authKey || ""}`}
          </p>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {expanded ? "Fechar" : "Testar"}
          </button>
          <button
            onClick={remove}
            className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25"
            title="Remover API"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
            <input
              value={pathOverride}
              onChange={(e) => setPathOverride(e.target.value)}
              placeholder="/endpoint"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {method === "POST" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"email":"teste@dominio.com"}'
              rows={3}
              className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <button
            onClick={test}
            disabled={testing}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {testing ? "Chamando…" : "Executar chamada"}
          </button>
          {result && (
            <div className="rounded-md border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold">
                Status:{" "}
                <span className={result.ok ? "text-[oklch(0.7_0.18_162)]" : "text-destructive"}>
                  {result.status} {result.ok ? "OK" : "ERRO"}
                </span>
              </p>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">
                {result.error
                  ? result.error
                  : typeof result.data === "string"
                    ? result.data
                    : JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============== CAMPAIGN DETAILS MODAL ==============
function CampaignDetailsModal({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const details = useQuery({
    queryKey: ["meta-campaign-details", campaignId],
    queryFn: () => getCampaignDetails({ data: { campaignId, datePreset: "last_30d" } }),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const data = details.data?.ok ? details.data.data : null;
  const err = details.data && !details.data.ok ? details.data.error : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl rounded-xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Detalhes da campanha</p>
            <h2 className="mt-1 truncate text-lg font-semibold">
              {data?.campaign?.name || (details.isFetching ? "Carregando…" : "Campanha")}
            </h2>
            {data?.campaign && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={data.campaign.effective_status || data.campaign.status} />
                <span>• Objetivo: {data.campaign.objective}</span>
                {data.campaign.bid_strategy && <span>• Bid: {data.campaign.bid_strategy}</span>}
                {data.campaign.daily_budget && (
                  <span>• Budget: {formatBRL(parseInt(data.campaign.daily_budget) / 100)}/dia</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-card p-2 hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 space-y-6">
          {details.isFetching && !data && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {err && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {err}
            </div>
          )}

          {data && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Mini label="Gasto" value={formatBRL(data.insights.spend)} />
                <Mini label="Receita" value={formatBRL(data.insights.revenue)} />
                <Mini
                  label="ROAS"
                  value={`${data.insights.roas.toFixed(2)}x`}
                  highlight={data.insights.roas >= 2 ? "good" : data.insights.roas >= 1 ? "warn" : "bad"}
                />
                <Mini label="CPA" value={formatBRL(data.insights.cpa)} />
                <Mini label="Impressões" value={formatNumber(data.insights.impressions)} />
                <Mini label="Cliques no link" value={formatNumber(data.insights.link_clicks)} />
                <Mini label="CTR" value={formatPct(data.insights.ctr)} />
                <Mini label="CPM" value={formatBRL(data.insights.cpm)} />
              </div>

              {/* Adsets */}
              <Section title={`Conjuntos de anúncios (${data.adsets.length})`}>
                {data.adsets.length === 0 ? (
                  <Empty text="Nenhum adset" />
                ) : (
                  <div className="space-y-2">
                    {data.adsets.map((s: any) => (
                      <AdsetRow key={s.id} adset={s} onChanged={() => details.refetch()} />
                    ))}
                  </div>
                )}
              </Section>

              {/* Ads + Creatives */}
              <AdSection ads={data.ads} onChanged={() => details.refetch()} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdSection({ ads, onChanged }: { ads: any[]; onChanged: () => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.ceil(ads.length / pageSize);
  const start = (page - 1) * pageSize;
  const currentAds = ads.slice(start, start + pageSize);

  return (
    <Section title={`Anúncios e criativos (${ads.length})`}>
      {ads.length === 0 ? (
        <Empty text="Nenhum anúncio" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentAds.map((ad: any) => (
              <CreativeCard key={ad.id} ad={ad} onChanged={onChanged} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-border pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-border bg-card px-3 py-1 text-xs hover:bg-accent disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-border bg-card px-3 py-1 text-xs hover:bg-accent disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}


function Mini({ label, value, highlight }: { label: string; value: string; highlight?: "good" | "warn" | "bad" }) {
  const tone =
    highlight === "good"
      ? "text-[oklch(0.7_0.18_162)]"
      : highlight === "warn"
        ? "text-[oklch(0.77_0.19_70)]"
        : highlight === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
      {text}
    </p>
  );
}

function AdsetRow({ adset, onChanged }: { adset: any; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [budget, setBudget] = useState(
    adset.daily_budget ? (parseInt(adset.daily_budget) / 100).toString() : "",
  );
  const [busy, setBusy] = useState(false);
  const isPaused = (adset.effective_status || adset.status) === "PAUSED";

  const toggle = async () => {
    setBusy(true);
    await updateAdsetStatus({
      data: { adsetId: adset.id, status: isPaused ? "ACTIVE" : "PAUSED" },
    });
    setBusy(false);
    onChanged();
  };

  const saveBudget = async () => {
    const n = parseFloat(budget);
    if (!isFinite(n) || n < 1) return;
    setBusy(true);
    await updateAdsetBudget({ data: { adsetId: adset.id, dailyBudgetBRL: n } });
    setBusy(false);
    setEditing(false);
    onChanged();
  };

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">{adset.name}</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={adset.effective_status || adset.status} />
          <button
            onClick={toggle}
            disabled={busy}
            className="rounded border border-border bg-card px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
          >
            {isPaused ? "Ativar" : "Pausar"}
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {adset.optimization_goal && <span>Otimização: {adset.optimization_goal}</span>}
        {adset.bid_amount && <span>• Bid: {formatBRL(parseInt(adset.bid_amount) / 100)}</span>}
        {!editing ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2">
              • Budget:{" "}
              {adset.daily_budget ? `${formatBRL(parseInt(adset.daily_budget) / 100)}/dia` : "—"}
            </span>
            {adset.adset_spend_limit && (
              <span className="flex items-center gap-2">
                • Limite: Min {formatBRL(adset.adset_spend_limit.min_daily_budget / 100)} / Max {adset.adset_spend_limit.max_daily_budget ? formatBRL(adset.adset_spend_limit.max_daily_budget / 100) : "∞"}
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="rounded border border-border bg-card px-2 py-0.5 text-[10px] hover:bg-accent"
            >
              Editar orç./limite
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded border border-border bg-background p-2">
            <div className="flex items-center gap-2">
              <span className="w-20 text-[10px] font-bold uppercase">Budget dia</span>
              <div className="flex items-center gap-1">
                <span>R$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-20 rounded border border-border bg-background px-2 py-0.5 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-[10px] font-bold uppercase">Mínimo dia</span>
              <div className="flex items-center gap-1">
                <span>R$</span>
                <input
                  type="number"
                  placeholder="0"
                  defaultValue={adset.adset_spend_limit?.min_daily_budget ? (adset.adset_spend_limit.min_daily_budget / 100) : ""}
                  onChange={(e) => {
                    (adset as any)._pendingMin = e.target.value;
                  }}
                  className="w-20 rounded border border-border bg-background px-2 py-0.5 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-[10px] font-bold uppercase">Máximo dia</span>
              <div className="flex items-center gap-1">
                <span>R$</span>
                <input
                  type="number"
                  placeholder="∞"
                  defaultValue={adset.adset_spend_limit?.max_daily_budget ? (adset.adset_spend_limit.max_daily_budget / 100) : ""}
                  onChange={(e) => {
                    (adset as any)._pendingMax = e.target.value;
                  }}
                  className="w-20 rounded border border-border bg-background px-2 py-0.5 text-xs"
                />
              </div>
            </div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <button
                onClick={async () => {
                  const min = parseFloat((adset as any)._pendingMin ?? (adset.adset_spend_limit?.min_daily_budget ? (adset.adset_spend_limit.min_daily_budget / 100).toString() : ""));
                  const max = parseFloat((adset as any)._pendingMax ?? (adset.adset_spend_limit?.max_daily_budget ? (adset.adset_spend_limit.max_daily_budget / 100).toString() : ""));
                  setBusy(true);
                  await Promise.all([
                    saveBudget(),
                    updateAdsetSpendLimit({ 
                      data: { 
                        adsetId: adset.id, 
                        minDailyBRL: isNaN(min) ? undefined : min, 
                        maxDailyBRL: isNaN(max) ? undefined : max 
                      } 
                    })
                  ]);
                  setBusy(false);
                  setEditing(false);
                  onChanged();
                }}
                disabled={busy}
                className="rounded bg-primary px-3 py-1 text-[10px] text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Salvar tudo
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded border border-border bg-card px-3 py-1 text-[10px] hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function CreativeCard({ ad, onChanged }: { ad: any; onChanged: () => void }) {
  const cre = ad.creative || {};
  const story = cre.object_story_spec || {};
  const link = story.link_data || story.video_data || {};
  const img =
    cre.image_url ||
    cre.thumbnail_url ||
    link.picture ||
    ad._previewImage ||
    null;
  const title = cre.title || link.name || link.title || ad.name;
  const body = cre.body || link.message || link.description;
  const cta = cre.call_to_action_type || link.call_to_action?.type;
  const isVideo = !!(cre.video_id || link.video_id);
  const isPaused = (ad.effective_status || ad.status) === "PAUSED";

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(ad.name || "");
  const [busy, setBusy] = useState(false);

  const togglePause = async () => {
    setBusy(true);
    await updateAdStatus({
      data: { adId: ad.id, status: isPaused ? "ACTIVE" : "PAUSED" },
    });
    setBusy(false);
    onChanged();
  };

  const saveName = async () => {
    if (!name.trim() || name === ad.name) {
      setEditingName(false);
      return;
    }
    setBusy(true);
    await updateAdName({ data: { adId: ad.id, name: name.trim() } });
    setBusy(false);
    setEditingName(false);
    onChanged();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/10">
      <div className="relative flex aspect-square items-center justify-center bg-muted/40">
        {img ? (
          <img src={img} alt={title || "Criativo"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            {isVideo ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
            <p className="mt-2 text-xs">Pré-visualização indisponível</p>
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={ad.effective_status || ad.status} />
        </div>
        <button
          onClick={togglePause}
          disabled={busy}
          className="absolute right-2 top-2 rounded border border-border bg-card/90 px-2 py-1 text-[10px] backdrop-blur hover:bg-accent disabled:opacity-50"
        >
          {isPaused ? "Ativar" : "Pausar"}
        </button>
      </div>
      <div className="p-3">
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <button
              onClick={saveName}
              disabled={busy}
              className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              OK
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                setName(ad.name || "");
              }}
              className="rounded border border-border bg-card px-2 py-1 text-[10px] hover:bg-accent"
            >
              X
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="line-clamp-1 w-full text-left text-sm font-medium hover:text-primary"
            title="Clique para editar o nome"
          >
            {ad.name || title}
          </button>
        )}
        {title && title !== ad.name && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">Título: {title}</p>
        )}
        {body && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{body}</p>}
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {cta && <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">{cta}</span>}
          {isVideo && <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">Vídeo</span>}
          <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">ID: {ad.id}</span>
        </div>
        {ad.insights && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-2 text-xs">
            <div>
              <p className="text-muted-foreground">Gasto</p>
              <p className="font-semibold">{formatBRL(ad.insights.spend)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ROAS</p>
              <p
                className={`font-semibold ${ad.insights.roas >= 2 ? "text-[oklch(0.7_0.18_162)]" : ""}`}
              >
                {ad.insights.roas.toFixed(2)}x
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">CTR</p>
              <p className="font-semibold">{formatPct(ad.insights.ctr)}</p>
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-2">
          {cre.instagram_permalink_url && (
            <a
              href={cre.instagram_permalink_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Instagram
            </a>
          )}
          <a
            href={`https://www.facebook.com/adsmanager/manage/ads/edit?act=&selected_ad_ids=${ad.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" /> Editar no Ads Manager
          </a>
        </div>
      </div>
    </div>
  );
}

// ============== AUTOMAÇÃO ==============
function Automacao({
  camps,
  campConv,
  roas,
}: {
  camps: any[];
  campConv: any[];
  roas: number;
}) {
  const recommendations = useMemo(
    () => generateRecommendations(campConv, camps, { roasTarget: 2, cpaTarget: 10 }),
    [campConv, camps],
  );

  // alertas legados (mantém compatibilidade)
  const alerts: { type: "danger" | "warning" | "info"; msg: string }[] = [];
  if (roas < 2 && roas > 0)
    alerts.push({ type: "danger", msg: `ROAS conta abaixo de 2x (atual ${roas.toFixed(2)}x)` });

  const counts = recommendations.reduce(
    (a, r) => {
      a[r.severity]++;
      return a;
    },
    { critical: 0, warning: 0, opportunity: 0, info: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-xs uppercase text-muted-foreground">Críticas (pausar)</p>
          <p className="mt-2 text-2xl font-bold text-destructive">{counts.critical}</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.77_0.19_70/0.3)] bg-[oklch(0.77_0.19_70/0.05)] p-5">
          <p className="text-xs uppercase text-muted-foreground">Avisos (ajustar)</p>
          <p className="mt-2 text-2xl font-bold text-[oklch(0.77_0.19_70)]">{counts.warning}</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.7_0.18_162/0.3)] bg-[oklch(0.7_0.18_162/0.05)] p-5">
          <p className="text-xs uppercase text-muted-foreground">Oportunidades (escalar)</p>
          <p className="mt-2 text-2xl font-bold text-[oklch(0.7_0.18_162)]">{counts.opportunity}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <FileDown className="h-5 w-5 text-primary" />
          <h3 className="mt-2 text-sm font-semibold">Relatório PDF</h3>
          <button
            onClick={() => window.print()}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <FileDown className="h-3 w-3" /> Exportar
          </button>
        </div>
      </div>

      <RecommendationsPanel recommendations={recommendations} camps={camps} campConv={campConv} />

      <AutoModePanel recommendations={recommendations} camps={camps} campConv={campConv} />

      <AuditLogPanel />


      {alerts.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h3 className="text-sm font-semibold">🚨 Alertas da conta</h3>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${a.type === "danger" ? "text-destructive" : "text-[oklch(0.77_0.19_70)]"}`}
                />
                <p className="text-sm">{a.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== APPLY HOOK (compartilhado entre manual e auto) ==============
function useApplyRecommendation(camps: any[], campConv: any[]) {
  const qc = useQueryClient();

  const pause = useMutation({
    mutationFn: (id: string) => updateCampaignStatus({ data: { campaignId: id, status: "PAUSED" } }),
  });

  const adjustBudget = useMutation({
    mutationFn: (vars: { id: string; cents: number }) =>
      updateBudget({ data: { id: vars.id, dailyBudgetCents: vars.cents, type: "campaign" } }),
  });

  const apply = async (r: Recommendation, mode: "manual" | "auto"): Promise<{ ok: boolean; error?: string }> => {
    const impact = estimateImpact(r, campConv as any);
    try {
      let result: { ok: boolean; error?: string } = { ok: true };

      switch (r.action) {
        case "PAUSE":
          result = await pause.mutateAsync(r.campaignId);
          break;
        case "DECREASE_BUDGET":
        case "INCREASE_BUDGET":
          if (r.suggestedDailyBudgetCents) {
            result = await adjustBudget.mutateAsync({
              id: r.campaignId,
              cents: r.suggestedDailyBudgetCents,
            });
          } else {
            result = { ok: false, error: "Budget no adset (CBO) — ajuste manual" };
          }
          break;
        case "DUPLICATE_WINNER":
        case "CHANGE_AUDIENCE":
        case "CHANGE_CREATIVE":
        case "FIX_LANDING_PAGE":
          result = { ok: false, error: "Ação requer intervenção manual" };
          break;
      }

      appendAudit({
        mode,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        action: r.action,
        severity: r.severity,
        title: r.title,
        status: result.ok ? "success" : "skipped",
        errorMessage: result.ok ? undefined : result.error,
        estimatedSpendDelta: impact.spendDelta,
        estimatedRevenueDelta: impact.revenueDelta,
        estimatedRoasDelta: impact.roasDelta,
      });

      if (result.ok) {
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        qc.invalidateQueries({ queryKey: ["meta-camp-conv"] });
      }

      return result;
    } catch (e: any) {
      const error = e?.message || "Falha desconhecida";
      appendAudit({
        mode,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        action: r.action,
        severity: r.severity,
        title: r.title,
        status: "error",
        errorMessage: error,
      });
      return { ok: false, error };
    }
  };

  const isPending = (id: string) =>
    (pause.isPending && pause.variables === id) ||
    (adjustBudget.isPending && adjustBudget.variables?.id === id);

  return { apply, isPending };
}

// ============== RECOMMENDATIONS PANEL (1-clique com preview) ==============
function RecommendationsPanel({
  recommendations,
  camps,
  campConv,
}: {
  recommendations: Recommendation[];
  camps: any[];
  campConv: any[];
}) {
  const [duplicateFor, setDuplicateFor] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<Recommendation | null>(null);
  const { apply, isPending } = useApplyRecommendation(camps, campConv);

  const handleConfirm = async (r: Recommendation) => {
    setPreviewFor(null);
    if (r.action === "DUPLICATE_WINNER") {
      setDuplicateFor(r.campaignId);
      return;
    }
    const res = await apply(r, "manual");
    if (res.ok) toast.success("Aplicado com sucesso");
    else if (res.error) toast.error(res.error);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <SectionHeader
          title="🤖 Recomendações Automáticas"
          subtitle={`${recommendations.length} ações sugeridas — clique para ver impacto estimado antes de aplicar`}
        />
      </div>
      <div className="divide-y divide-border">
        {recommendations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              ✨ Nenhuma recomendação no momento. Suas campanhas ativas estão saudáveis ou não há gasto suficiente para análise.
            </p>
          </div>
        ) : (
          recommendations.map((r) => {
            const meta = ACTION_LABELS[r.action];
            const pending = isPending(r.campaignId);
            return (
              <div key={r.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${SEVERITY_STYLES[r.severity]}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <p className="truncate text-sm font-bold">{r.title}</p>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {r.severity}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {r.campaignName}
                  </p>
                  <p className="mt-1 text-xs">{r.reason}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span>📊 {r.metric}</span>
                    {r.suggestedDailyBudgetCents && r.currentDailyBudgetCents ? (
                      <span>
                        💰 {formatBRL(r.currentDailyBudgetCents / 100)} →{" "}
                        <strong className="text-foreground">{formatBRL(r.suggestedDailyBudgetCents / 100)}</strong>/dia
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFor(r)}
                  disabled={pending}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50 ${meta.color}`}
                >
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  Pré-visualizar
                </button>
              </div>
            );
          })
        )}
      </div>

      {previewFor && (
        <ImpactPreviewModal
          rec={previewFor}
          campConv={campConv}
          onClose={() => setPreviewFor(null)}
          onConfirm={() => handleConfirm(previewFor)}
        />
      )}

      {duplicateFor && (
        <DuplicateCampaignModal
          camps={camps}
          campConv={[]}
          preselectedId={duplicateFor}
          onClose={() => setDuplicateFor(null)}
        />
      )}
    </div>
  );
}

// ============== IMPACT PREVIEW MODAL ==============
function ImpactPreviewModal({
  rec,
  campConv,
  onClose,
  onConfirm,
}: {
  rec: Recommendation;
  campConv: any[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const impact = useMemo(() => estimateImpact(rec, campConv as any), [rec, campConv]);
  const meta = ACTION_LABELS[rec.action];
  const confColors = {
    alta: "text-[oklch(0.7_0.18_162)] bg-[oklch(0.7_0.18_162/0.15)]",
    média: "text-[oklch(0.77_0.19_70)] bg-[oklch(0.77_0.19_70/0.15)]",
    baixa: "text-destructive bg-destructive/15",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase text-muted-foreground">Pré-visualização de impacto</p>
              <h2 className="mt-1 text-lg font-bold">
                {meta.emoji} {rec.title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{rec.campaignName}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${confColors[impact.confidence]}`}>
              Confiança {impact.confidence}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* Comparação atual vs projetada */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <ImpactMetric
              label="Gasto diário"
              current={formatBRL(impact.currentDailySpend)}
              projected={formatBRL(impact.projectedDailySpend)}
              delta={impact.spendDelta}
              format={(v) => formatBRL(v)}
              invertGood
            />
            <ImpactMetric
              label="Receita diária"
              current={formatBRL(impact.currentDailyRevenue)}
              projected={formatBRL(impact.projectedDailyRevenue)}
              delta={impact.revenueDelta}
              format={(v) => formatBRL(v)}
            />
            <ImpactMetric
              label="ROAS"
              current={`${impact.currentRoas.toFixed(2)}x`}
              projected={`${impact.projectedRoas.toFixed(2)}x`}
              delta={impact.roasDelta}
              format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}x`}
            />
            <ImpactMetric
              label="CVR (clique→compra)"
              current={`${impact.currentCvr.toFixed(2)}%`}
              projected={`${impact.projectedCvr.toFixed(2)}%`}
              delta={impact.cvrDelta}
              format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}pp`}
            />
            <ImpactMetric
              label="Compras/dia (estim.)"
              current={impact.currentDailyPurchases.toFixed(1)}
              projected={impact.projectedDailyPurchases.toFixed(1)}
              delta={impact.projectedDailyPurchases - impact.currentDailyPurchases}
              format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`}
            />
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Janela base</p>
              <p className="mt-1 font-semibold">últimos 7 dias</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Projeção = média diária × ajuste da ação
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs font-semibold">📋 Motivo da recomendação</p>
            <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
          </div>

          {/* Notes */}
          {impact.notes.length > 0 && (
            <div className="rounded-lg border border-[oklch(0.77_0.19_70/0.3)] bg-[oklch(0.77_0.19_70/0.05)] p-3">
              <p className="text-xs font-semibold">💡 Premissas e observações</p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {impact.notes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-xs font-bold ${meta.color}`}
          >
            <Zap className="h-3 w-3" /> Aplicar agora
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactMetric({
  label,
  current,
  projected,
  delta,
  format,
  invertGood = false,
}: {
  label: string;
  current: string;
  projected: string;
  delta: number;
  format: (v: number) => string;
  invertGood?: boolean;
}) {
  const isPositive = delta > 0.001;
  const isNegative = delta < -0.001;
  const isGood = invertGood ? isNegative : isPositive;
  const isBad = invertGood ? isPositive : isNegative;
  const color = isGood
    ? "text-[oklch(0.7_0.18_162)]"
    : isBad
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-xs text-muted-foreground line-through">{current}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-bold">{projected}</span>
      </div>
      <p className={`mt-0.5 text-[10px] font-semibold ${color}`}>{format(delta)}</p>
    </div>
  );
}

// ============== AUTO MODE PANEL ==============
function AutoModePanel({
  recommendations,
  camps,
  campConv,
}: {
  recommendations: Recommendation[];
  camps: any[];
  campConv: any[];
}) {
  const [settings, setSettings] = useState<AutoModeSettings>(() => loadAutoModeSettings());
  const [running, setRunning] = useState(false);
  const { apply } = useApplyRecommendation(camps, campConv);
  const ranThisLoad = useRef(false);

  const update = (patch: Partial<AutoModeSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAutoModeSettings(next);
  };

  const toggleSeverity = (s: Severity) => {
    const has = settings.applySeverities.includes(s);
    update({
      applySeverities: has
        ? settings.applySeverities.filter((x) => x !== s)
        : [...settings.applySeverities, s],
    });
  };

  const toggleAction = (a: ActionType) => {
    const has = settings.applyActions.includes(a);
    update({
      applyActions: has
        ? settings.applyActions.filter((x) => x !== a)
        : [...settings.applyActions, a],
    });
  };

  // filtra recomendações elegíveis para auto-apply
  const eligible = useMemo(
    () =>
      recommendations.filter(
        (r) =>
          settings.applySeverities.includes(r.severity) &&
          settings.applyActions.includes(r.action),
      ),
    [recommendations, settings.applySeverities, settings.applyActions],
  );

  const runNow = async (mode: "auto" | "manual" = "manual") => {
    if (running) return;
    setRunning(true);
    let totalIncrease = 0;
    let applied = 0;
    let skipped = 0;
    for (const r of eligible) {
      // proteção: respeitar limite diário de aumento de gasto
      if (r.action === "INCREASE_BUDGET" && r.suggestedDailyBudgetCents && r.currentDailyBudgetCents) {
        const inc = r.suggestedDailyBudgetCents - r.currentDailyBudgetCents;
        if (totalIncrease + inc > settings.maxDailySpendIncreaseCents) {
          appendAudit({
            mode,
            campaignId: r.campaignId,
            campaignName: r.campaignName,
            action: r.action,
            severity: r.severity,
            title: r.title,
            status: "skipped",
            errorMessage: `Limite diário de aumento (${formatBRL(settings.maxDailySpendIncreaseCents / 100)}) atingido`,
          });
          skipped++;
          continue;
        }
        totalIncrease += inc;
      }
      const res = await apply(r, mode);
      if (res.ok) applied++;
      else skipped++;
    }
    update({ lastRunAt: Date.now() });
    setRunning(false);
    if (mode === "auto") {
      toast.success(`Auto-execução: ${applied} aplicadas, ${skipped} ignoradas`);
    } else {
      toast.success(`${applied} ações aplicadas, ${skipped} ignoradas`);
    }
  };

  // Roda automaticamente uma vez ao carregar, se for o horário
  useEffect(() => {
    if (ranThisLoad.current) return;
    if (!shouldRunAutoNow(settings)) return;
    if (eligible.length === 0) return;
    ranThisLoad.current = true;
    runNow("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.enabled, settings.scheduleHour, eligible.length]);

  const allSeverities: Severity[] = ["critical", "warning", "opportunity"];
  const allActions: ActionType[] = ["PAUSE", "DECREASE_BUDGET", "INCREASE_BUDGET"];

  const lastRun = settings.lastRunAt
    ? new Date(settings.lastRunAt).toLocaleString("pt-BR")
    : "nunca";

  return (
    <div className={`rounded-xl border ${settings.enabled ? "border-[oklch(0.7_0.18_162)] bg-[oklch(0.7_0.18_162/0.05)]" : "border-border bg-card"}`}>
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold">⚡ Modo Auto de Verdade</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aplica recomendações automaticamente uma vez por dia, com auditoria completa.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Última execução: <strong className="text-foreground">{lastRun}</strong>
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm font-bold">
            {settings.enabled ? "ATIVO" : "Desativado"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold">📅 Horário de execução diária</p>
          <select
            value={settings.scheduleHour}
            onChange={(e) => update({ scheduleHour: parseInt(e.target.value) })}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
            disabled={!settings.enabled}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Roda quando você abrir o dashboard após esse horário (limite: 1x/dia).
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold">💰 Aumento máximo de gasto/dia</p>
          <input
            type="number"
            value={settings.maxDailySpendIncreaseCents / 100}
            onChange={(e) =>
              update({ maxDailySpendIncreaseCents: Math.max(0, parseFloat(e.target.value) || 0) * 100 })
            }
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
            disabled={!settings.enabled}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Trava de segurança: o auto NUNCA aumenta mais do que esse valor por execução.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold">🎯 Severidades habilitadas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allSeverities.map((s) => (
              <label key={s} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={settings.applySeverities.includes(s)}
                  onChange={() => toggleSeverity(s)}
                  disabled={!settings.enabled}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold">⚙️ Ações permitidas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allActions.map((a) => (
              <label key={a} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={settings.applyActions.includes(a)}
                  onChange={() => toggleAction(a)}
                  disabled={!settings.enabled}
                />
                {ACTION_LABELS[a].emoji} {ACTION_LABELS[a].label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs">
          <p>
            <strong>{eligible.length}</strong> de {recommendations.length} recomendação(ões) elegível(eis) agora.
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Apenas as que casam com severidades e ações marcadas acima.
          </p>
        </div>
        <button
          onClick={() => runNow("manual")}
          disabled={running || eligible.length === 0}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Executar batch agora
        </button>
      </div>
    </div>
  );
}

// ============== AUDIT LOG PANEL ==============
function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => loadAuditLog());
  const [filter, setFilter] = useState<"all" | "auto" | "manual">("all");

  useEffect(() => {
    const handler = () => setEntries(loadAuditLog());
    window.addEventListener("audit-log-updated", handler);
    return () => window.removeEventListener("audit-log-updated", handler);
  }, []);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.mode === filter);

  const exportCsv = () => {
    const header = "timestamp,mode,campaign,action,severity,status,error,spend_delta,revenue_delta,roas_delta\n";
    const rows = entries.map((e) =>
      [
        new Date(e.timestamp).toISOString(),
        e.mode,
        `"${e.campaignName.replace(/"/g, '""')}"`,
        e.action,
        e.severity,
        e.status,
        `"${(e.errorMessage || "").replace(/"/g, '""')}"`,
        e.estimatedSpendDelta?.toFixed(2) ?? "",
        e.estimatedRevenueDelta?.toFixed(2) ?? "",
        e.estimatedRoasDelta?.toFixed(2) ?? "",
      ].join(","),
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold">📜 Registro de Auditoria</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Histórico de todas as ações aplicadas (manual ou auto), com impacto estimado.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="all">Todos ({entries.length})</option>
            <option value="manual">Manual</option>
            <option value="auto">Auto</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
          >
            <FileDown className="h-3 w-3" /> CSV
          </button>
          <button
            onClick={() => {
              if (confirm("Limpar todo o histórico de auditoria?")) {
                clearAuditLog();
                setEntries([]);
              }
            }}
            disabled={entries.length === 0}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-destructive/10 disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum registro ainda. Aplique uma recomendação para começar.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-left text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Data/Hora</th>
                <th className="px-3 py-2">Modo</th>
                <th className="px-3 py-2">Ação</th>
                <th className="px-3 py-2">Campanha</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Δ Gasto/dia</th>
                <th className="px-3 py-2 text-right">Δ Receita/dia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => {
                const meta = ACTION_LABELS[e.action];
                const statusColor =
                  e.status === "success"
                    ? "text-[oklch(0.7_0.18_162)]"
                    : e.status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground";
                return (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.mode === "auto" ? "bg-[oklch(0.7_0.18_162/0.2)] text-[oklch(0.7_0.18_162)]" : "bg-muted"}`}
                      >
                        {e.mode}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {meta.emoji} {meta.label}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2">{e.campaignName}</td>
                    <td className={`px-3 py-2 font-semibold ${statusColor}`}>
                      {e.status === "success" ? "✓ OK" : e.status === "error" ? "✗ Erro" : "⊘ Skip"}
                      {e.errorMessage && (
                        <span className="ml-1 text-[10px] text-muted-foreground">({e.errorMessage})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {e.estimatedSpendDelta !== undefined ? formatBRL(e.estimatedSpendDelta) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {e.estimatedRevenueDelta !== undefined ? formatBRL(e.estimatedRevenueDelta) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

