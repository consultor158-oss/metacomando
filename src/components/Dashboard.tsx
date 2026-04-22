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
  generateAdCopy,
  getConversionFunnel,
  getClickBreakdown,
  getCampaignsConversion,
} from "../server/meta";
import { SCALE_STRATEGIES, type ScaleStrategy } from "../lib/scales";
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
        {tab === "escalas" && <Escalas />}
        {tab === "ia" && <IATab />}
        {tab === "automacao" && <Automacao camps={camps} roas={overallROAS} />}
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
function Analise({ camps, totals, loading }: any) {
  const top = [...camps].sort((a, b) => b.roas - a.roas).slice(0, 5);
  const bottom = [...camps].filter((c) => c.spend > 0).sort((a, b) => a.roas - b.roas).slice(0, 5);

  const reach = totals.impressions;
  const clicks = totals.clicks;
  const conv = totals.conversions;
  const funnel = [
    { label: "Impressões", value: reach, pct: 100 },
    { label: "Cliques", value: clicks, pct: reach > 0 ? (clicks / reach) * 100 : 0 },
    { label: "Conversões", value: conv, pct: clicks > 0 ? (conv / clicks) * 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeader title="Funil de Conversão" loading={loading} />
        <div className="mt-4 space-y-3">
          {funnel.map((f, i) => (
            <div key={i}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="text-muted-foreground">
                  {formatNumber(f.value)} • {f.pct.toFixed(2)}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all"
                  style={{ width: `${Math.max(2, f.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightCard title="🚀 Top Performers" rows={top} type="top" loading={loading} />
        <InsightCard title="⚠️ Gargalos" rows={bottom} type="bottom" loading={loading} />
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
          {camps.map((c) => {
            const isActive = (c.effective_status || c.status) === "ACTIVE";
            return (
              <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.objective} • {formatBRL(c.spend)} gasto • ROAS {c.roas.toFixed(2)}x
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.effective_status || c.status} />
                  {isActive ? (
                    <button
                      onClick={() => toggle.mutate({ campaignId: c.id, status: "PAUSED" })}
                      disabled={toggle.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.77_0.19_70/0.2)] px-3 py-1.5 text-xs font-medium text-[oklch(0.77_0.19_70)] hover:bg-[oklch(0.77_0.19_70/0.3)] disabled:opacity-50"
                    >
                      <Pause className="h-3 w-3" /> Pausar
                    </button>
                  ) : (
                    <button
                      onClick={() => toggle.mutate({ campaignId: c.id, status: "ACTIVE" })}
                      disabled={toggle.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.7_0.18_162/0.2)] px-3 py-1.5 text-xs font-medium text-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.7_0.18_162/0.3)] disabled:opacity-50"
                    >
                      <Play className="h-3 w-3" /> Ativar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
function Escalas() {
  const [active, setActive] = useState<ScaleStrategy | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-chart-4/10 p-5">
        <h3 className="text-sm font-semibold">📋 Guia Geral de Subida</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          1. Anexe criativos no Controle → 2. Escolha estratégia abaixo → 3. Defina público / orçamento / objetivo →
          4. Clique <strong className="text-primary">SUBIR via API</strong>. Regra de ROI: pause sempre que CPA &gt; R$10.
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
function Automacao({ camps, roas }: { camps: any[]; roas: number }) {
  const alerts: { type: "danger" | "warning" | "info"; msg: string }[] = [];
  if (roas < 2 && roas > 0) alerts.push({ type: "danger", msg: `ROAS conta abaixo de 2x (atual ${roas.toFixed(2)}x)` });
  for (const c of camps) {
    const eff = c.effective_status || c.status;
    if (eff === "ACTIVE" && c.cpa > 10 && c.conversions > 0)
      alerts.push({ type: "warning", msg: `${c.name}: CPA ${formatBRL(c.cpa)} acima de R$10 — considere pausar` });
    if (eff === "ACTIVE" && c.spend > 100 && c.roas < 1)
      alerts.push({ type: "danger", msg: `${c.name}: ROAS ${c.roas.toFixed(2)}x e gasto ${formatBRL(c.spend)} — pausar` });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="mt-3 text-sm font-semibold">Alertas Inteligentes</h3>
          <p className="mt-1 text-xs text-muted-foreground">ROAS &lt; 2x · CPA &gt; R$10 · Adsets sem conversão</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="mt-3 text-sm font-semibold">Subida Automática</h3>
          <p className="mt-1 text-xs text-muted-foreground">Cards de Escala com 1 clique disparam POST na Graph API</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <FileDown className="h-5 w-5 text-primary" />
          <h3 className="mt-3 text-sm font-semibold">Relatório Semanal</h3>
          <button
            onClick={() => window.print()}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <FileDown className="h-3 w-3" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h3 className="text-sm font-semibold">🚨 Alertas Ativos ({alerts.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {alerts.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Tudo certo! 🎉</div>
          )}
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
    </div>
  );
}
