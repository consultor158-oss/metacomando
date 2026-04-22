import { useState, useMemo } from "react";
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
} from "../server/meta";
import { SCALE_STRATEGIES, type ScaleStrategy } from "../lib/scales";
import {
  generateRecommendations,
  ACTION_LABELS,
  SEVERITY_STYLES,
  type Recommendation,
} from "../lib/recommendations";
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
  const insightsRows = insights.data?.ok ? insights.data.data : [];
  const camps = campaigns.data?.ok ? campaigns.data.data : [];

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
        <SectionHeader title="Performance Diária" subtitle="Gasto vs Receita / ROAS / CPA" loading={loadingInsights} onRefresh={onRefreshInsights} />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 265)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 265)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.18 162)" stopOpacity={0.6} />
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
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <SectionHeader title="Campanhas" subtitle={`${camps.length} encontradas no período`} loading={loading} onRefresh={onRefresh} />
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
            </tr>
          </thead>
          <tbody>
            {loading && camps.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={8} className="px-5 py-4">
                    <div className="h-5 animate-pulse rounded bg-muted/60" />
                  </td>
                </tr>
              ))
            ) : camps.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  Nenhuma campanha encontrada no período
                </td>
              </tr>
            ) : (
              camps.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
    onSuccess: (res) => {
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

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{c.name}</p>
        <p className="text-xs text-muted-foreground">
          {c.objective} • {formatBRL(c.spend)} gasto • ROAS {c.roas.toFixed(2)}x
          {currentBudget > 0 && ` • Budget ${formatBRL(currentBudget)}/dia`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            💰 Editar budget
          </button>
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
      </div>
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

      {active && <ScaleModal strategy={active} onClose={() => setActive(null)} />}
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

function ScaleModal({ strategy, onClose }: { strategy: ScaleStrategy; onClose: () => void }) {
  const [name, setName] = useState(`${strategy.defaults.namePrefix} - ${new Date().toLocaleDateString("pt-BR")}`);
  const [budget, setBudget] = useState(strategy.defaults.dailyBudgetCents / 100);
  const [objective, setObjective] = useState(strategy.defaults.objective);
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">(strategy.defaults.status);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () =>
      createCampaign({
        data: {
          name,
          objective,
          status,
          dailyBudgetCents: Math.round(budget * 100),
          strategy: strategy.id,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Campanha "${name}" criada!`);
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        onClose();
      } else {
        toast.error(res.error || "Falha ao subir");
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-3xl">{strategy.emoji}</div>
            <h3 className="mt-2 text-xl font-bold">{strategy.name}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">{strategy.fullDesc}</p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Nome da campanha</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Status inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PAUSED">Pausada</option>
                <option value="ACTIVE">Ativa</option>
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

        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r ${strategy.color} px-4 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50`}
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {create.isPending ? "Subindo via API…" : "🚀 SUBIR via API"}
        </button>
      </div>
    </div>
  );
}

// ============== APIs / IA ==============
function IATab() {
  const prompts = [
    { title: "Imagem (Midjourney)", body: "/imagine cinematic product photo of [PRODUTO], golden hour, ultra detailed, 35mm, --ar 4:5" },
    { title: "Música/VSL (Suno)", body: "Upbeat brazilian funk pop, 90 bpm, motivational hook for [PRODUTO], 30s" },
    { title: "Roteiro VSL (IA)", body: "Roteiro de 30s para Reels: gancho 3s, problema, solução [PRODUTO], CTA forte" },
    { title: "Headline (IA)", body: "Gere 10 headlines de Meta Ads para [PRODUTO] focado em [DOR]" },
  ];
  return (
    <div className="space-y-6">
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

      <RecommendationsPanel recommendations={recommendations} camps={camps} />

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

// ============== RECOMMENDATIONS PANEL (1-clique para aplicar) ==============
function RecommendationsPanel({
  recommendations,
  camps,
}: {
  recommendations: Recommendation[];
  camps: any[];
}) {
  const qc = useQueryClient();
  const [duplicateFor, setDuplicateFor] = useState<string | null>(null);

  const pause = useMutation({
    mutationFn: (id: string) => updateCampaignStatus({ data: { campaignId: id, status: "PAUSED" } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Campanha pausada");
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
        qc.invalidateQueries({ queryKey: ["meta-camp-conv"] });
      } else toast.error(res.error || "Falha");
    },
  });

  const adjustBudget = useMutation({
    mutationFn: (vars: { id: string; cents: number }) =>
      updateBudget({ data: { id: vars.id, dailyBudgetCents: vars.cents, type: "campaign" } }),
    onSuccess: (res, vars) => {
      if (res.ok) {
        toast.success(`Budget ajustado para ${formatBRL(vars.cents / 100)}/dia`);
        qc.invalidateQueries({ queryKey: ["meta-campaigns"] });
      } else toast.error(res.error || "Falha (CBO?)");
    },
  });

  const apply = (r: Recommendation) => {
    switch (r.action) {
      case "PAUSE":
        pause.mutate(r.campaignId);
        break;
      case "DECREASE_BUDGET":
      case "INCREASE_BUDGET":
        if (r.suggestedDailyBudgetCents) {
          adjustBudget.mutate({ id: r.campaignId, cents: r.suggestedDailyBudgetCents });
        } else {
          toast.info("Edite o budget na aba Controle (CBO ativo no adset).");
        }
        break;
      case "DUPLICATE_WINNER":
        setDuplicateFor(r.campaignId);
        break;
      case "CHANGE_AUDIENCE":
      case "CHANGE_CREATIVE":
      case "FIX_LANDING_PAGE":
        toast.info(`Ação manual recomendada: ${r.title}. Acesse o Meta Ads Manager.`);
        break;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <SectionHeader
          title="🤖 Recomendações Automáticas"
          subtitle={`${recommendations.length} ações sugeridas baseadas em CVR, ROAS e funil real`}
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
            const isPending =
              (pause.isPending && pause.variables === r.campaignId) ||
              (adjustBudget.isPending && adjustBudget.variables?.id === r.campaignId);
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
                  onClick={() => apply(r)}
                  disabled={isPending}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50 ${meta.color}`}
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {meta.label}
                </button>
              </div>
            );
          })
        )}
      </div>

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
