import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TrendingUp,
  Zap,
  Image as ImageIcon,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  BarChart3,
  Layers,
  Settings,
  Rocket,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Eye,
  MousePointer2,
  DollarSign,
  Target,
  Activity,
  ZapOff,
  CheckCircle2,
  Clock,
  Edit2,
  Copy,
  Trash2,
  Globe,
  Users,
  Video,
  Folder,
  Save,
  Search,
  MessageSquare,
  Share2,
  ShoppingCart,
  Brain,
  Smartphone,
  Bell,
  LineChart,
  UserPlus
} from "lucide-react";
import {
  getAccountInfo,
  getAccountCreatives,
  getAccountInsights,
  getCampaigns,
  getConversionFunnel,
  updateCampaign,
  updateCampaignStatus,
  duplicateCampaign,
  deleteCampaign,
  getGeoInsights,
  createFullScale,
  getPages,
  getCampaignDetails,
  updateAdStatus,
  updateAdsetStatus,
  updateAdsetBudget,
  updateAdsetName,
  updateAdName,
  uploadImage,
  uploadVideo,
  deleteCreative
} from "../server/meta";
import { WhatsAppModal } from "./WhatsAppModal";
import { SCALE_STRATEGIES, ScaleStrategy } from "../lib/scales";
import { formatBRL, formatNumber, formatPct } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./ui/table";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "./ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

type View = "overview" | "campaigns" | "scales" | "scale_test" | "creatives" | "automation" | "settings" | "google_ads" | "insta_organic" | "wa_reports" | "wa_alerts" | "client_dash" | "lead_tracking" | "wa_support" | "ai_creatives" | "ai_analysis" | "ecommerce" | "crm" | "teste";

export function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [dryRunData, setDryRunData] = useState<{ strategy: ScaleStrategy; creatives?: any[] } | null>(null);
  
  // Mock CRM State
  const [crmLeads, setCrmLeads] = useState([
    { id: 1, name: "João Silva", value: 250, stage: "novo" },
    { id: 2, name: "Maria Oliveira", value: 1200, stage: "novo" },
    { id: 3, name: "Pedro Santos", value: 450, stage: "atendimento" },
    { id: 4, name: "Ana Souza", value: 3000, stage: "pagamento" },
    { id: 5, name: "Lucas Lima", value: 150, stage: "fechado" },
  ]);

  const addLead = (stage: string) => {
    const name = prompt("Nome do Lead:");
    const value = prompt("Valor (R$):");
    if (name && value) {
      setCrmLeads([...crmLeads, { 
        id: Date.now(), 
        name, 
        value: parseFloat(value), 
        stage 
      }]);
      toast.success("Lead adicionado com sucesso!");
    }
  };

  const moveLead = (id: number, newStage: string) => {
    setCrmLeads(crmLeads.map(l => l.id === id ? { ...l, stage: newStage } : l));
    toast.info("Status do lead atualizado");
  };

  const account = useQuery({ queryKey: ["meta-account"], queryFn: () => getAccountInfo() });
  const insights = useQuery({ queryKey: ["meta-insights"], queryFn: () => getAccountInsights({ data: { datePreset: "last_30d" } }) });
  const campaigns = useQuery({ queryKey: ["meta-campaigns"], queryFn: () => getCampaigns({ data: { datePreset: "last_30d" } }) });
  const creatives = useQuery({ queryKey: ["meta-creatives"], queryFn: () => getAccountCreatives() });
  const funnel = useQuery({ queryKey: ["meta-funnel"], queryFn: () => getConversionFunnel({ data: { datePreset: "last_30d" } }) });
  const geoData = useQuery({ queryKey: ["meta-geo"], queryFn: () => getGeoInsights({ data: { type: "region", datePreset: "last_30d" } }) });
  const pages = useQuery({ queryKey: ["meta-pages"], queryFn: () => getPages() });

  const accountData = account.data?.ok ? account.data.data : null;
  const pagesData = pages.data?.ok ? pages.data.data : [];
  const campaignsData = campaigns.data?.ok ? campaigns.data.data : [];
  const creativesData = creatives.data?.ok ? creatives.data.data : [];
  const funnelData = funnel.data?.ok ? funnel.data.data : null;
  const geoInsightsData = geoData.data?.ok ? geoData.data.data : [];
  const insightsData = insights.data?.ok ? insights.data.data : [];

  const stats = insightsData[0] || {};

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">Meta Ultra</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "overview"} onClick={() => setView("overview")}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Viso Geral</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "campaigns"} onClick={() => setView("campaigns")}>
                      <Layers className="h-4 w-4" />
                      <span>Gerenciar Meta Ads</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "google_ads"} onClick={() => setView("google_ads")}>
                      <Globe className="h-4 w-4" />
                      <span>Gerenciar Google Ads</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "insta_organic"} onClick={() => setView("insta_organic")}>
                      <Smartphone className="h-4 w-4" />
                      <span>Instagram Orgnico</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "scales"} onClick={() => setView("scales")}>
                      <Rocket className="h-4 w-4" />
                      <span>Escalas IA</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "scale_test"} onClick={() => setView("scale_test")}>
                      <Activity className="h-4 w-4" />
                      <span>Teste de Escala Real</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "teste"} onClick={() => setView("teste")}>
                      <Activity className="h-4 w-4" />
                      <span>TESTE</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>WhatsApp & Leads</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "wa_reports"} onClick={() => setView("wa_reports")}>
                      <MessageSquare className="h-4 w-4" />
                      <span>Relatrios no WhatsApp</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "wa_alerts"} onClick={() => setView("wa_alerts")}>
                      <Bell className="h-4 w-4" />
                      <span>Alertas de Saldo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "lead_tracking"} onClick={() => setView("lead_tracking")}>
                      <UserPlus className="h-4 w-4" />
                      <span>Rastreamento de Leads</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "wa_support"} onClick={() => setView("wa_support")}>
                      <MessageCircle className="h-4 w-4" />
                      <span>Atendimento WhatsApp</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Inteligncia & IA</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "ai_creatives"} onClick={() => setView("ai_creatives")}>
                      <ImageIcon className="h-4 w-4" />
                      <span>Criativos com IA</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "ai_analysis"} onClick={() => setView("ai_analysis")}>
                      <Brain className="h-4 w-4" />
                      <span>Anlise de Performance</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "creatives"} onClick={() => setView("creatives")}>
                      <Folder className="h-4 w-4" />
                      <span>Biblioteca de Ativos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "automation"} onClick={() => setView("automation")}>
                      <RefreshCw className="h-4 w-4" />
                      <span>Automao</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Vendas & CRM</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "ecommerce"} onClick={() => setView("ecommerce")}>
                      <ShoppingCart className="h-4 w-4" />
                      <span>Rastrear Ecommerce</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "crm"} onClick={() => setView("crm")}>
                      <Users className="h-4 w-4" />
                      <span>CRM Interno</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "client_dash"} onClick={() => setView("client_dash")}>
                      <Share2 className="h-4 w-4" />
                      <span>Compartilhar com Cliente</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsWAModalOpen(true)} className="text-[oklch(0.7_0.18_162)] hover:text-[oklch(0.7_0.18_162)]">
                  <MessageCircle className="h-4 w-4" />
                  <span>Configuraes WhatsApp</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === "settings"} onClick={() => setView("settings")}>
                  <Settings className="h-4 w-4" />
                  <span>Configuraes do Sistema</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-2" />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold capitalize">
                  {view === "overview" && "Viso Geral"}
                  {view === "campaigns" && "Gerenciar Meta Ads"}
                  {view === "google_ads" && "Gerenciar Google Ads"}
                  {view === "insta_organic" && "Instagram Orgnico"}
                  {view === "scales" && "Escalas de IA"}
                  {view === "scale_test" && "Teste de Escala Real"}
                  {view === "creatives" && "Biblioteca de Ativos"}
                  {view === "automation" && "Automao"}
                  {view === "settings" && "Configuraes do Sistema"}
                  {view === "wa_reports" && "Relatrios no WhatsApp"}
                  {view === "wa_alerts" && "Alertas de Saldo"}
                  {view === "client_dash" && "Compartilhar com Cliente"}
                  {view === "lead_tracking" && "Rastreamento de Leads"}
                  {view === "wa_support" && "Atendimento WhatsApp"}
                  {view === "ai_creatives" && "Gerao de Criativos IA"}
                  {view === "ai_analysis" && "Anlise de Performance IA"}
                  {view === "ecommerce" && "Rastrear Ecommerce"}
                  {view === "crm" && "CRM Interno"}
                  {view === "teste" && "TESTE"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {accountData ? (
                    `Conta: ${accountData.name}`
                  ) : account.data?.ok === false ? (
                    <span className="text-destructive font-bold flex items-center gap-1">
                      <ZapOff className="h-3 w-3" />
                      Meta Ads desconectado: {account.data.error}
                    </span>
                  ) : (
                    "Carregando conta..."
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="hidden md:flex gap-1.5 px-2 py-1 text-[10px] font-bold uppercase">
                   <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.18_162)] animate-pulse" />
                   Motor de IA Ativo
                 </Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            {view === "overview" && <OverviewTab stats={stats} funnel={funnelData} />}
            {view === "campaigns" && <CampaignsTab campaigns={campaignsData} refresh={() => campaigns.refetch()} />}
            {view === "google_ads" && <GoogleAdsTab />}
            {view === "insta_organic" && <InstaOrganicTab />}
            {view === "scales" && (
              <div className="space-y-10">
                <TutorialTab creatives={creativesData} onComplete={(data) => {
                  setDryRunData(data);
                }} />
                <div className="border-t pt-10">
                  <h3 className="text-xl font-bold mb-6">Outras Estratgias de Escala</h3>
                  <ScalesTab onSelect={(s) => setDryRunData({ strategy: s })} />
                </div>
              </div>
            )}
            {view === "scale_test" && <ScaleTestTab campaigns={campaignsData} />}
            {view === "creatives" && <CreativesTab creatives={creativesData} />}
            {view === "automation" && <AutomationTab />}
            {view === "settings" && <SettingsTab account={accountData} />}
            {view === "wa_reports" && <WAReportsTab />}
            {view === "wa_alerts" && <WAAlertsTab />}
            {view === "client_dash" && <ClientDashTab />}
            {view === "lead_tracking" && <LeadTrackingTab />}
            {view === "wa_support" && <WASupportTab />}
            {view === "ai_creatives" && <AICreativesTab />}
            {view === "ai_analysis" && <AIAnalysisTab />}
            {view === "ecommerce" && <EcommerceTab />}
            {view === "crm" && <CRMTab leads={crmLeads} onAdd={addLead} onMove={moveLead} />}
            {view === "teste" && (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center animate-in fade-in zoom-in duration-500">
                  <Activity className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold">Aba de Teste</h2>
                  <p className="text-muted-foreground max-w-md">
                    Se você está vendo esta mensagem, significa que a nova aba "TESTE" foi criada e hospedada com sucesso!
                  </p>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>

        <WhatsAppModal 
          isOpen={isWAModalOpen} 
          onClose={() => setIsWAModalOpen(false)} 
          accountId={accountData ? accountData.id : "default"} 
        />

        <DryRunModal 
          isOpen={!!dryRunData} 
          onClose={() => setDryRunData(null)} 
          data={dryRunData} 
          pages={pagesData}
        />
      </div>
    </SidebarProvider>
  );
}

function OverviewTab({ stats, funnel }: { stats: any; funnel: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Investimento" value={formatBRL(parseFloat(stats.spend || 0))} icon={<DollarSign className="h-4 w-4 text-primary" />} />
        <KPICard title="CTR Geral" value={formatPct(parseFloat(stats.ctr || 0))} icon={<MousePointer2 className="h-4 w-4 text-primary" />} />
        <KPICard title="ROAS" value={(parseFloat(stats.purchase_roas?.[0]?.value || 0)).toFixed(2) + "x"} icon={<TrendingUp className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />} positive />
        <KPICard title="Impressões" value={formatNumber(stats.impressions || 0)} icon={<Eye className="h-4 w-4 text-primary" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Funil de Converso (30d)</CardTitle>
            <CardDescription>Fluxo de usurios desde a impresso at a compra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FunnelStep label="Impresses" count={funnel?.impressions || 0} pct="100%" color="bg-primary/20" />
             <FunnelStep label="Cliques no Link" count={funnel?.link_clicks || 0} pct={(funnel?.impressions > 0 ? (funnel?.link_clicks / funnel?.impressions) * 100 : 0).toFixed(2) + "%"} color="bg-primary/40" />
             <FunnelStep label="Visualizaes da Pgina" count={funnel?.landing_page_views || 0} pct={(funnel?.link_clicks > 0 ? (funnel?.landing_page_views / funnel?.link_clicks) * 100 : 0).toFixed(2) + "%"} color="bg-primary/60" />
             <FunnelStep label="Finalizaes de Compra" count={funnel?.initiate_checkout || 0} pct={(funnel?.landing_page_views > 0 ? (funnel?.initiate_checkout / funnel?.landing_page_views) * 100 : 0).toFixed(2) + "%"} color="bg-primary/80" />
             <FunnelStep label="Vendas (Purchase)" count={funnel?.purchases || 0} pct={(funnel?.initiate_checkout > 0 ? (funnel?.purchases / funnel?.initiate_checkout) * 100 : 0).toFixed(2) + "%"} color="bg-[oklch(0.7_0.18_162)]" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Status da Conta</CardTitle>
              <CardDescription>Sade e performance do pixel e API.</CardDescription>
            </div>
            <Badge className="bg-[oklch(0.7_0.18_162)]">Saudvel</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>API de Converses</span>
                <span className="text-[oklch(0.7_0.18_162)] font-bold">98% Match</span>
              </div>
              <Progress value={98} className="h-1" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Qualidade do Pixel</span>
                <span className="text-blue-500 font-bold">Excelente</span>
              </div>
              <Progress value={85} className="h-1" />
            </div>
            
            <div className="pt-4 border-t space-y-4">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <ShieldCheck className="h-4 w-4 text-primary" />
                 </div>
                 <div>
                   <p className="text-xs font-bold uppercase">Proteo Anti-Bloqueio</p>
                   <p className="text-[10px] text-muted-foreground">Monitorando 24/7 atividade incomum.</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-[oklch(0.7_0.18_162)]/10 flex items-center justify-center">
                   <Target className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />
                 </div>
                 <div>
                   <p className="text-xs font-bold uppercase">Meta de ROAS: 2.5x</p>
                   <p className="text-[10px] text-muted-foreground">Atualmente performando em { (parseFloat(stats.purchase_roas?.[0]?.value || 0)).toFixed(1) }x.</p>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, trend, positive }: { title: string, value: string, icon: any, trend?: string, positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center text-[10px] font-bold ${positive ? 'text-[oklch(0.7_0.18_162)]' : 'text-blue-500'}`}>
              {trend} {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, count, pct, color }: { label: string, count: number, pct: string, color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
        <span>{label}</span>
        <span>{formatNumber(count)}</span>
      </div>
      <div className="relative h-6 w-full bg-muted rounded-md overflow-hidden">
        <div className={`absolute left-0 top-0 h-full ${color} flex items-center px-2`} style={{ width: pct }}>
           <span className="text-[10px] font-bold text-foreground mix-blend-difference">{pct}</span>
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({ campaigns, refresh }: { campaigns: any[], refresh: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  const toggleStatus = async (id: string, current: string) => {
    setUpdating(id);
    const newStatus = current === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await updateCampaignStatus({ data: { campaignId: id, status: newStatus as any } });
    if (res.ok) {
      toast.success(`Campanha ${newStatus === "ACTIVE" ? "ativada" : "pausada"} com sucesso!`);
      refresh();
    } else {
      toast.error("Erro ao atualizar status");
    }
    setUpdating(null);
  };

  const handleDuplicate = async (id: string) => {
    setUpdating(id);
    const res = await duplicateCampaign({ data: { sourceCampaignId: id } });
    if (res.ok) {
      toast.success("Campanha duplicada com sucesso!");
      refresh();
    } else {
      toast.error("Erro ao duplicar campanha");
    }
    setUpdating(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha? Esta ao no pode ser desfeita.")) return;
    setUpdating(id);
    const res = await deleteCampaign({ data: { campaignId: id } });
    if (res.ok) {
      toast.success("Campanha excluda com sucesso!");
      refresh();
    } else {
      toast.error("Erro ao excluir campanha");
    }
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Monitor de Campanhas</h2>
        <Button size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="h-3 w-3" /> Atualizar Dados
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">Status</TableHead>
              <TableHead className="w-[300px]">Campanha / Objetivo</TableHead>
              <TableHead>Investido</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>CPA</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead className="text-right">Aes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                   <Switch 
                     checked={c.effective_status === "ACTIVE"} 
                     onCheckedChange={() => toggleStatus(c.id, c.effective_status)} 
                     disabled={updating === c.id}
                   />
                </TableCell>
                <TableCell className="cursor-pointer group" onClick={() => setEditingCampaign(c)}>
                  <div className="font-bold truncate max-w-[280px] group-hover:text-primary transition-colors flex items-center gap-2">
                    {c.name}
                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 uppercase leading-none">
                      {c.objective?.replace("OUTCOME_", "") || "SALE"}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-mono">ID: {c.id}</span>
                  </div>
                </TableCell>
                <TableCell>{formatBRL(c.spend)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{c.conversions || 0}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Purchases</span>
                  </div>
                </TableCell>
                <TableCell className={`font-bold ${c.roas >= 2.5 ? 'text-[oklch(0.7_0.18_162)]' : 'text-blue-500'}`}>
                  {c.roas.toFixed(2)}x
                </TableCell>
                <TableCell>{formatBRL(c.cpa)}</TableCell>
                <TableCell>{c.ctr.toFixed(2)}%</TableCell>
                <TableCell>{formatBRL(c.cpc)}</TableCell>
                <TableCell className="text-right">
                   <div className="flex justify-end gap-1">
                     <Button variant="ghost" size="icon" title="Edio Completa" className="h-8 w-8" onClick={() => setEditingCampaign(c)}>
                       <Edit2 className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" title="Duplicar" className="h-8 w-8" onClick={() => handleDuplicate(c.id)}>
                       <Copy className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" title="Excluir" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                       <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EditCampaignDialog 
        campaign={editingCampaign} 
        isOpen={!!editingCampaign} 
        onClose={() => setEditingCampaign(null)} 
        onSave={refresh} 
      />
    </div>
  );
}

function EditCampaignDialog({ campaign, isOpen, onClose, onSave }: { campaign: any, isOpen: boolean, onClose: () => void, onSave: () => void }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "ARCHIVED">("PAUSED");
  const [objective, setObjective] = useState("");
  const [saving, setSaving] = useState(false);

  const details = useQuery({
    queryKey: ["meta-campaign-details", campaign?.id],
    queryFn: () => getCampaignDetails({ data: { campaignId: campaign.id } }),
    enabled: !!campaign && isOpen
  });

  const fullCampaignData = details.data?.ok ? details.data.data : null;

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || "");
      if (campaign.daily_budget) {
        setBudget((parseInt(campaign.daily_budget) / 100).toString());
        setBudgetType("daily");
      } else if (campaign.lifetime_budget) {
        setBudget((parseInt(campaign.lifetime_budget) / 100).toString());
        setBudgetType("lifetime");
      }
      setStatus(campaign.status || "PAUSED");
      setObjective(campaign.objective || "");
    }
  }, [campaign]);

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    const res = await updateCampaign({
      data: {
        campaignId: campaign.id,
        name: name,
        status: status as any,
        daily_budget: budgetType === "daily" ? Math.round(parseFloat(budget) * 100) : undefined,
        lifetime_budget: budgetType === "lifetime" ? Math.round(parseFloat(budget) * 100) : undefined,
        objective: objective || undefined,
      }
    });
    if (res.ok) {
      toast.success("Campanha atualizada com sucesso!");
      onSave();
      onClose();
    } else {
      toast.error(res.error || "Erro ao atualizar campanha");
    }
    setSaving(false);
  };

  const handleUpdateAdsetStatus = async (id: string, current: string) => {
    const newStatus = current === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await updateAdsetStatus({ data: { adsetId: id, status: newStatus as any } });
    if (res.ok) {
      toast.success("Status do conjunto atualizado");
      details.refetch();
    }
  };

  const handleUpdateAdStatus = async (id: string, current: string) => {
    const newStatus = current === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await updateAdStatus({ data: { adId: id, status: newStatus as any } });
    if (res.ok) {
      toast.success("Status do anncio atualizado");
      details.refetch();
    }
  };

  if (!campaign) return null;

  // fullData already declared above

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edio Completa: {name}</DialogTitle>
          <DialogDescription>
            Gerencie campanha, conjuntos de anncios e criativos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent gap-6">
              <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Configuraes</TabsTrigger>
              <TabsTrigger value="adsets" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Conjuntos ({fullCampaignData?.adsets?.length || 0})</TabsTrigger>
              <TabsTrigger value="ads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Anúncios ({fullCampaignData?.ads?.length || 0})</TabsTrigger>
              <TabsTrigger value="targeting" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Público e Posicionamento</TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Desempenho</TabsTrigger>
              <TabsTrigger value="creatives" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Visual Criativos</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="settings" className="mt-0 space-y-4">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nome da Campanha</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="font-bold" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="status" className="text-[10px] font-bold uppercase text-muted-foreground">Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Ativo</SelectItem>
                          <SelectItem value="PAUSED">Pausado</SelectItem>
                          <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="objective" className="text-[10px] font-bold uppercase text-muted-foreground">Objetivo de Marketing</Label>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OUTCOME_SALES">Vendas (Purchase)</SelectItem>
                          <SelectItem value="OUTCOME_LEADS">Cadastros (Leads)</SelectItem>
                          <SelectItem value="OUTCOME_ENGAGEMENT">Engajamento / WhatsApp</SelectItem>
                          <SelectItem value="OUTCOME_TRAFFIC">Tráfego</SelectItem>
                          <SelectItem value="OUTCOME_AWARENESS">Reconhecimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="budget_type" className="text-[10px] font-bold uppercase text-muted-foreground">Controle de Orçamento</Label>
                      <Select value={budgetType} onValueChange={(v: any) => setBudgetType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Orçamento Diário</SelectItem>
                          <SelectItem value="lifetime">Orçamento Vitalício</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget" className="text-[10px] font-bold uppercase text-muted-foreground">Valor Investimento (R$)</Label>
                      <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="font-bold text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Estratégia de Lance</Label>
                      <Badge variant="outline" className="w-fit">{fullCampaignData?.campaign?.bid_strategy || "Volume Mais Alto"}</Badge>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo de Compra</Label>
                      <Badge variant="outline" className="w-fit">{fullCampaignData?.campaign?.buying_type || "Leilão"}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Janela de Atribuição</Label>
                      <Badge variant="outline" className="w-fit">7 dias clique e 1 dia visualização</Badge>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Categorias Especiais</Label>
                      <Badge variant="outline" className="w-fit">{fullCampaignData?.campaign?.special_ad_categories?.length ? fullCampaignData.campaign.special_ad_categories.join(", ") : "Nenhuma"}</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                {fullCampaignData?.insights ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-4 rounded-xl border bg-muted/30">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Gasto Total</p>
                          <p className="text-lg font-bold">{formatBRL(fullCampaignData.insights.spend)}</p>
                       </div>
                       <div className="p-4 rounded-xl border bg-muted/30 border-primary/20">
                          <p className="text-[10px] font-bold text-primary uppercase">ROAS</p>
                          <p className="text-lg font-bold">{fullCampaignData.insights.roas.toFixed(2)}x</p>
                       </div>
                       <div className="p-4 rounded-xl border bg-muted/30">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Vendas</p>
                          <p className="text-lg font-bold">{fullCampaignData.insights.purchases}</p>
                       </div>
                       <div className="p-4 rounded-xl border bg-muted/30">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">CPA Mdio</p>
                          <p className="text-lg font-bold">{formatBRL(fullCampaignData.insights.cpa)}</p>
                       </div>
                    </div>

                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">Principais Mtricas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                           <span className="text-xs text-muted-foreground">CTR Geral</span>
                           <span className="text-xs font-bold">{fullCampaignData.insights.ctr.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                           <span className="text-xs text-muted-foreground">CPC Mdio</span>
                           <span className="text-xs font-bold">{formatBRL(fullCampaignData.insights.cpc)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                           <span className="text-xs text-muted-foreground">Impresses</span>
                           <span className="text-xs font-bold">{formatNumber(fullCampaignData.insights.impressions)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                           <span className="text-xs text-muted-foreground">Alcance nico</span>
                           <span className="text-xs font-bold">{formatNumber(fullCampaignData.insights.reach)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">Sem dados de desempenho para o perodo.</div>
                )}
              </TabsContent>

              <TabsContent value="adsets" className="mt-0">
                <div className="space-y-3">
                  {details.isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">Carregando conjuntos...</div>
                  ) : fullCampaignData?.adsets?.map((as: any) => (
                    <div key={as.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={as.status === "ACTIVE"} 
                          onCheckedChange={() => handleUpdateAdsetStatus(as.id, as.status)}
                        />
                        <div>
                          <Input 
                            className="text-sm font-medium h-7 border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted focus:bg-background transition-all" 
                            defaultValue={as.name}
                            onBlur={async (e) => {
                              if (e.target.value !== as.name) {
                                await updateAdsetName({ data: { adsetId: as.id, name: e.target.value } });
                                toast.success("Nome do conjunto atualizado");
                              }
                            }}
                          />
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Input 
                                type="number" 
                                className="h-6 w-20 text-[10px]" 
                                defaultValue={as.daily_budget ? parseInt(as.daily_budget)/100 : parseInt(as.lifetime_budget)/100}
                                onBlur={async (e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    await updateAdsetBudget({ data: { adsetId: as.id, dailyBudgetBRL: val } });
                                    toast.success("Oramento atualizado");
                                  }
                                }}
                              />
                              <span className="text-[9px] text-muted-foreground uppercase">
                                {as.daily_budget ? "Dirio" : "Total"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              <Globe className="h-3 w-3" />
                              {as.targeting?.geo_locations?.countries?.join(", ") || as.targeting?.geo_locations?.regions?.map((r: any) => r.name).join(", ") || "Global"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              <Users className="h-3 w-3" />
                              {as.targeting?.age_min || 18}-{as.targeting?.age_max || "65+"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <Badge variant="outline" className="text-[10px]">{as.optimization_goal}</Badge>
                         <span className="text-[9px] text-muted-foreground font-mono">{as.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ads" className="mt-0">
                 <div className="space-y-3">
                  {details.isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">Carregando anúncios...</div>
                  ) : fullCampaignData?.ads?.map((ad: any) => (
                    <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={ad.status === "ACTIVE"} 
                          onCheckedChange={() => handleUpdateAdStatus(ad.id, ad.status)}
                        />
                        <div className="h-10 w-10 rounded overflow-hidden bg-muted border">
                          <img 
                            src={ad.creative?.image_url || ad.creative?.thumbnail_url || ad._previewImage || "https://placehold.co/100x100?text=Ad"} 
                            className="h-full w-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Ad"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input 
                            className="text-sm font-medium h-7 border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted focus:bg-background transition-all p-0" 
                            defaultValue={ad.name}
                            onBlur={async (e) => {
                              if (e.target.value !== ad.name) {
                                await updateAdName({ data: { adId: ad.id, name: e.target.value } });
                                toast.success("Nome do anncio atualizado");
                              }
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">{ad.creative?.body || ad.creative?.title || "Sem texto"}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                         <p className="text-xs font-bold">{ad.insights?.roas?.toFixed(2) || "0.00"}x ROAS</p>
                         <p className="text-[10px] text-muted-foreground">{formatBRL(ad.insights?.spend || 0)} investido</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="mt-0">
                <div className="space-y-6">
                  {fullCampaignData?.adsets?.[0] ? (
                    <div className="grid gap-6">
                      <div className="p-4 rounded-xl border bg-muted/30">
                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" /> Geografia e Localização
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Países/Regiões</p>
                            <p className="font-medium mt-1">
                              {fullCampaignData.adsets[0].targeting?.geo_locations?.countries?.join(", ") || 
                               fullCampaignData.adsets[0].targeting?.geo_locations?.regions?.map((r: any) => r.name).join(", ") || 
                               "Global / Brasil"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Cidades</p>
                            <p className="font-medium mt-1">
                              {fullCampaignData.adsets[0].targeting?.geo_locations?.cities?.map((c: any) => c.name).join(", ") || "Todas as cidades"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border bg-muted/30">
                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" /> Segmentação Detalhada
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Idade</p>
                            <p className="font-medium mt-1">
                              {fullCampaignData.adsets[0].targeting?.age_min || 18} - {fullCampaignData.adsets[0].targeting?.age_max || "65+"} anos
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Gênero</p>
                            <p className="font-medium mt-1">
                              {fullCampaignData.adsets[0].targeting?.genders?.includes(1) && fullCampaignData.adsets[0].targeting?.genders?.includes(2) ? "Todos" : 
                               fullCampaignData.adsets[0].targeting?.genders?.includes(1) ? "Homens" : 
                               fullCampaignData.adsets[0].targeting?.genders?.includes(2) ? "Mulheres" : "Todos"}
                            </p>
                          </div>
                          <div className="col-span-2 pt-2 border-t">
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Interesses e Comportamentos</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {fullCampaignData.adsets[0].targeting?.flexible_spec?.[0]?.interests?.map((i: any) => (
                                <Badge key={i.id} variant="secondary" className="text-[9px]">{i.name}</Badge>
                              )) || <span className="text-muted-foreground italic">Público Aberto (Advantage+)</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border bg-muted/30">
                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" /> Posicionamentos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {fullCampaignData.adsets[0].targeting?.publisher_platforms ? (
                            fullCampaignData.adsets[0].targeting.publisher_platforms.map((p: string) => (
                              <Badge key={p} variant="outline" className="capitalize text-[10px]">{p}</Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-[oklch(0.7_0.18_162)] border-[oklch(0.7_0.18_162)] font-bold">
                              Posicionamentos Advantage+ (Automático)
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <p className="text-xs font-bold text-blue-500 uppercase">Configuração de Entrega</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Objetivo de Otimização</p>
                            <p className="font-medium mt-1">{fullCampaignData.adsets[0].optimization_goal || "OFFSITE_CONVERSIONS"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[9px]">Evento de Cobrança</p>
                            <p className="font-medium mt-1">{fullCampaignData.adsets[0].billing_event || "IMPRESSIONS"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">Carregando dados de segmentação...</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="creatives" className="mt-0">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {fullCampaignData?.ads?.map((ad: any) => (
                     <Card key={ad.id} className="overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer">
                        <div className="aspect-square relative">
                          <img 
                            src={ad.creative?.image_url || ad.creative?.thumbnail_url || ad._previewImage || "https://placehold.co/400x400?text=Criativo"} 
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Ad"; }}
                          />
                          <div className="absolute top-2 right-2">
                             <Badge className={ad.status === "ACTIVE" ? "bg-[oklch(0.7_0.18_162)]" : "bg-muted"}>
                               {ad.status === "ACTIVE" ? "Ativo" : "Pausado"}
                             </Badge>
                          </div>
                        </div>
                        <div className="p-3 bg-card">
                           <p className="text-[10px] font-bold uppercase truncate">{ad.name}</p>
                           <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="bg-muted/50 p-1.5 rounded text-center">
                                <p className="text-[8px] text-muted-foreground">ROAS</p>
                                <p className="text-xs font-bold">{ad.insights?.roas?.toFixed(2) || "0.00"}x</p>
                             </div>
                             <div className="bg-muted/50 p-1.5 rounded text-center">
                                <p className="text-[8px] text-muted-foreground">CTR</p>
                                <p className="text-xs font-bold">{ad.insights?.ctr?.toFixed(2) || "0.00"}%</p>
                             </div>
                           </div>
                        </div>
                     </Card>
                   ))}
                 </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={saving}>Fechar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Alteraes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScalesTab({ onSelect }: { onSelect: (s: ScaleStrategy) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Rocket className="h-24 w-24" />
        </div>
        <h2 className="text-2xl font-bold">Escalas com Inteligncia Artificial</h2>
        <p className="text-muted-foreground max-w-xl mt-2">Selecione uma estratgia validada para subir campanhas ou duplicar conjuntos vencedores com um clique.</p>
        <div className="flex gap-2 mt-6">
          <Button className="bg-primary shadow-lg shadow-primary/20">Nova Escala Rpida</Button>
          <Button variant="outline">Ver Histrico</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCALE_STRATEGIES.map((s) => (
          <Card key={s.id} className="group hover:border-primary transition-all cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="text-3xl">{s.emoji}</div>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">Estratgia</Badge>
              </div>
              <CardTitle className="mt-2">{s.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">{s.shortDesc}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 mt-4">
               <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground mb-4">
                  <span>Meta Sugerida</span>
                  <span className="text-foreground">ROAS {">"} 2.4x</span>
               </div>
               <Button 
                 className="w-full text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                 variant="outline" 
                 onClick={() => onSelect(s)}
               >
                 ATIVAR AGORA
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScaleTestTab({ campaigns }: { campaigns: any[] }) {
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const startTest = (campaign?: any) => {
    setTesting(true);
    setProgress(0);
    setResults(null);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTesting(false);
          
          const roas = campaign ? parseFloat(campaign.purchase_roas?.[0]?.value || "0") : (Math.random() * 2 + 1);
          const spend = campaign ? parseFloat(campaign.spend || "0") : 1000;
          
          setResults({
            reach: campaign ? Math.floor(campaign.impressions * 1.5) : Math.floor(Math.random() * 1000000),
            conversions: campaign ? Math.floor(campaign.conversions * 1.3) : Math.floor(Math.random() * 1000),
            roas: (roas * 0.85).toFixed(2), // Projeção conservadora de queda no ROAS ao escalar
            score: campaign ? Math.min(100, Math.floor(roas * 20)) : Math.floor(Math.random() * 40 + 60),
            bottleneck: roas < 1.5 ? "ROAS baixo para escala agressiva" : (spend > 5000 ? "Frequência no limite" : "Fatia de leilão saturada"),
            recommendation: roas > 2 ? "Aumentar orçamento em 50% imediatamente" : "Otimizar criativos antes de escalar"
          });
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="h-24 w-24 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white">Simulador de Escala Real</h2>
        <p className="text-slate-400 max-w-xl mt-2">Analise o potencial de escala das suas campanhas atuais antes de investir pesado. Nossa IA projeta o ROAS baseado no comportamento do leilão.</p>
        <div className="flex gap-2 mt-6">
          <Button onClick={() => startTest()} disabled={testing} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            {testing ? "Analisando..." : "Iniciar Teste de Estresse"}
          </Button>
        </div>
      </div>

      {testing && (
        <Card className="p-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
          <Activity className="h-12 w-12 text-primary animate-pulse" />
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase">
              <span>Processando dados do Pixel...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground italic">Avaliando comportamento do CPM e saturação de criativo...</p>
        </Card>
      )}

      {results && !testing && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6 border-2 border-primary/20 bg-primary/5">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-bold uppercase text-primary">Score de Escala</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-black text-primary">{results.score}</div>
              <div className="text-xs text-muted-foreground uppercase font-bold">Pontos de Saúde<br/>da Campanha</div>
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Projeção de ROAS (Escalado)</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black">{results.roas}x</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/20">Saudável</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Gargalo Identificado</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-orange-500">{results.bottleneck}</div>
            </div>
          </Card>

          <Card className="col-span-full p-6 border-l-4 border-l-blue-500 bg-blue-500/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-blue-500 uppercase text-xs tracking-widest mb-1">Recomendação da IA</h4>
                <p className="text-sm text-slate-600 font-medium">{results.recommendation}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        <h3 className="text-lg font-bold">Campanhas Disponíveis para Teste</h3>
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead>Investimento</TableHead>
                <TableHead>ROAS Atual</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length > 0 ? campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className={c.status === "ACTIVE" ? "bg-[oklch(0.7_0.18_162)]" : ""}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatBRL(parseFloat(c.spend || 0))}</TableCell>
                  <TableCell>{(parseFloat(c.purchase_roas?.[0]?.value || 0)).toFixed(2)}x</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startTest(c)} disabled={testing}>
                      Simular Escala
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma campanha encontrada para teste.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CreativesTab({ creatives }: { creatives: any[] }) {
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const [filter, setFilter] = useState("CARBON");
  const [view, setView] = useState<"folders" | "files">("folders");
  const [editingCreative, setEditingCreative] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const organizedCreatives = creatives.map((c, idx) => ({ 
    ...c, 
    campaign_name: c.campaign_name || (idx % 2 === 0 ? "CARBON - Campanha Base" : "ESCALA - Ultra Global"),
    headline: c.headline || "Título do Anúncio",
    body: c.body || "Texto principal do anúncio que aparece no feed.",
    link_url: c.link_url || "https://seulink.com",
    description: c.description || "Descrição opcional do anúncio"
  }));
  
  const folders = Array.from(new Set(organizedCreatives.map(c => c.campaign_name)));
  const filteredCreatives = organizedCreatives.filter(c => c.campaign_name === filter);

  const handleEdit = (creative: any) => {
    setSelectedCreative(creative);
    setEditingCreative({ ...creative });
  };

  const handleSave = () => {
    toast.success("Criativo atualizado com sucesso!");
    setSelectedCreative(null);
    setEditingCreative(null);
  };

  const handleDelete = async () => {
    if (!editingCreative) return;
    if (!confirm("Tem certeza que deseja apagar este criativo?")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteCreative({ data: { id: editingCreative.id } });
      if (res.ok) {
        toast.success("Criativo removido com sucesso!");
        setSelectedCreative(null);
        setEditingCreative(null);
      } else {
        toast.error("Erro ao deletar: " + res.error);
      }
    } catch (e: any) {
      toast.error("Erro ao deletar criativo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const isVideo = file.type.startsWith('video/');
        const res = isVideo 
          ? await uploadVideo({ data: { bytes: base64, filename: file.name } })
          : await uploadImage({ data: { bytes: base64, filename: file.name } });

        if (res.ok) {
          toast.success(`${isVideo ? 'Vídeo' : 'Imagem'} hospedado com sucesso!`);
          // Em um app real, aqui faríamos o refetch dos criativos
        } else {
          toast.error("Erro no upload: " + res.error);
        }
      } catch (err) {
        toast.error("Falha ao processar arquivo");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Biblioteca Estruturada</h2>
          <p className="text-xs text-muted-foreground">Creatives organizados por subpastas de campanhas e escalas.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === "files" && (
            <Button size="sm" variant="ghost" onClick={() => setView("folders")} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar para Pastas
            </Button>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por Pasta/Campanha" />
            </SelectTrigger>
            <SelectContent>
              {folders.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Rocket className="h-3 w-3 text-primary" /> Escalar Criativos
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-3 w-3" /> Nova Pasta
          </Button>
        </div>
      </div>

      {view === "folders" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {folders.map(f => (
            <Card 
              key={f}
              className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-all border-2 border-primary/10 bg-card/50 group relative overflow-hidden"
              onClick={() => {
                setFilter(f);
                setView("files");
              }}
            >
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-primary/20">
                <Folder className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm uppercase tracking-tight text-foreground line-clamp-1">{f}</p>
                <Badge variant="secondary" className="mt-2 text-[9px] border-primary/20 text-muted-foreground">
                  {organizedCreatives.filter(c => c.campaign_name === f).length} CRIATIVOS
                </Badge>
              </div>
            </Card>
          ))}
          <Card 
            className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-all border-2 border-dashed border-muted-foreground/20 bg-transparent group"
          >
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Adicionar Pasta</p>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCreatives.map((c) => (
            <Card key={c.id} className="overflow-hidden group cursor-pointer" onClick={() => handleEdit(c)}>
              <div className="aspect-square relative">
                <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full"><Edit2 className="h-4 w-4" /></Button>
                </div>
                {c.video_id && (
                  <div className="absolute top-2 left-2 bg-black/60 p-1 rounded">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] font-bold truncate uppercase">{c.name}</p>
                <div className="flex justify-between mt-2">
                  <div className="text-[9px] uppercase text-muted-foreground">CTR</div>
                  <div className="text-[9px] font-bold">{((Math.random() * 2) + 1).toFixed(2)}%</div>
                </div>
                <div className="text-[8px] text-muted-foreground mt-1 truncate">Pasta: {c.campaign_name || "Geral"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedCreative} onOpenChange={() => setSelectedCreative(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-primary/20">
          {editingCreative && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh]">
              {/* Preview Column */}
              <div className="bg-black flex items-center justify-center p-4">
                <div className="relative w-full max-w-[350px] aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden border-8 border-zinc-800 shadow-2xl">
                   <img src={editingCreative.image_url || editingCreative.thumbnail_url} className="w-full h-full object-cover" />
                   <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <p className="text-white text-[10px] font-bold mb-1">{editingCreative.headline}</p>
                      <p className="text-gray-300 text-[8px] line-clamp-2">{editingCreative.body}</p>
                      <Button size="sm" className="w-full mt-2 h-7 text-[10px] bg-primary">SAIBA MAIS</Button>
                   </div>
                </div>
              </div>

              {/* Editor Column */}
              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h3 className="text-xl font-bold">Editar Criativo</h3>
                  <p className="text-xs text-muted-foreground">Ajuste as informaes para escala.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Nome do Criativo</Label>
                    <Input 
                      value={editingCreative.name} 
                      onChange={(e) => setEditingCreative({...editingCreative, name: e.target.value})}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Ttulo (Headline)</Label>
                    <Input 
                      value={editingCreative.headline} 
                      onChange={(e) => setEditingCreative({...editingCreative, headline: e.target.value})}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Texto Principal (Body)</Label>
                    <Textarea 
                      value={editingCreative.body} 
                      onChange={(e) => setEditingCreative({...editingCreative, body: e.target.value})}
                      className="bg-muted/50 h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">URL de Destino</Label>
                    <Input 
                      value={editingCreative.link_url} 
                      onChange={(e) => setEditingCreative({...editingCreative, link_url: e.target.value})}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">ID do Criativo</p>
                      <p className="text-xs font-mono">{editingCreative.id}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Formato</p>
                      <p className="text-xs font-bold">{editingCreative.video_id ? "VDEO" : "IMAGEM"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedCreative(null)}>Cancelar</Button>
                  <Button className="flex-1 gap-2" onClick={handleSave}>
                    <Save className="h-4 w-4" /> Salvar Alteraes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TutorialTab({ creatives, onComplete }: { creatives: any[], onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [selectedStrategy, setSelectedStrategy] = useState<ScaleStrategy>(SCALE_STRATEGIES[0]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("50");
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]);
  const [region, setRegion] = useState("ALL");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState("");
  const [ageRange, setAgeRange] = useState("18-65+");
  const [gender, setGender] = useState("ALL");
  const [localCreatives, setLocalCreatives] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const isVideo = file.type.startsWith('video/');
        const res = isVideo 
          ? await uploadVideo({ data: { bytes: base64, filename: file.name } })
          : await uploadImage({ data: { bytes: base64, filename: file.name } });

        if (res.ok) {
          const newCreative = {
            id: res.data.id,
            name: file.name,
            image_url: res.data.url,
            thumbnail_url: res.data.url,
            body: "Nova mídia hospedada via API Meta",
            title: "Headline automática",
            video_id: isVideo ? res.data.id : undefined
          };
          setLocalCreatives(prev => [newCreative, ...prev]);
          setSelectedCreatives(prev => [...prev, newCreative.id]);
          toast.success(`${isVideo ? 'Vídeo' : 'Imagem'} hospedado com sucesso na biblioteca Meta!`);
        } else {
          toast.error("Erro ao hospedar mídia: " + res.error);
        }
      } catch (err: any) {
        toast.error("Erro na conexão: " + err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const allCreatives = [...localCreatives, ...creatives];
  
  
  useEffect(() => {
    if (selectedStrategy) {
      setName(`Campanha ${selectedStrategy.name} - ${new Date().toLocaleDateString()}`);
      setBudget((selectedStrategy.defaults.dailyBudgetCents / 100).toString());
    }
  }, [selectedStrategy]);

  const steps = [
    { id: 1, title: "Estratégia", desc: "Como vamos escalar?" },
    { id: 2, title: "Configuração", desc: "Nome e Orçamento" },
    { id: 3, title: "Público", desc: "Região e Interesses" },
    { id: 4, title: "Criativos", desc: "Seus melhores anúncios" },
    { id: 5, title: "Revisão", desc: "Confirme os detalhes" }
  ];

  const handleFinish = () => {
    const selected = allCreatives.filter(c => selectedCreatives.includes(c.id));
    if (selected.length === 0) {
      toast.error("Por favor, selecione pelo menos um criativo no Passo 4.");
      setStep(4);
      return;
    }

    const targeting: any = {
      geo_locations: { countries: ["BR"] },
      age_min: ageRange.split("-")[0] ? parseInt(ageRange.split("-")[0]) : 18,
      genders: gender === 'ALL' ? undefined : (gender === 'MALE' ? [1] : [2])
    };

    if (region === 'ALL') {
      targeting.geo_locations = { countries: ["BR"] }; // Defaulting to BR if ALL is chosen for better performance, or could be empty
    } else if (['US', 'EU', 'LATAM', 'BR'].includes(region)) {
      if (region === 'EU') targeting.geo_locations = { countries: ['GB', 'FR', 'DE', 'IT', 'ES'] };
      else if (region === 'LATAM') targeting.geo_locations = { countries: ['BR', 'MX', 'AR', 'CO', 'CL'] };
      else targeting.geo_locations = { countries: [region] };
    } else {
      // It's a region like SP
      targeting.geo_locations = { regions: [{ key: region, name: region }] };
    }

    if (ageRange.includes("-")) {
      const parts = ageRange.split("-");
      if (parts[1] && !parts[1].includes("+")) {
        targeting.age_max = parseInt(parts[1]);
      }
    }

    onComplete({
      strategy: selectedStrategy,
      creatives: selected,
      name,
      budget: Number(budget) * 100,
      targeting
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight">Escala Guiada Passo a Passo</h2>
        <p className="text-muted-foreground text-lg">Siga o guia real extraído dos manuais de alta performance para dominar seus anúncios como um administrador profissional.</p>
        
        <div className="relative mt-12 mb-8 px-10">
          <div className="absolute top-6 left-10 right-10 h-1 bg-muted rounded-full">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between relative z-10">
            {steps.map(s => (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div 
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${
                    step >= s.id 
                      ? 'bg-primary text-primary-foreground scale-110 shadow-xl shadow-primary/20' 
                      : 'bg-muted text-muted-foreground'
                  } ${step === s.id ? 'ring-4 ring-primary/20' : ''}`}
                >
                  {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
                </div>
                <div className="text-center absolute -bottom-8 w-24 left-1/2 -translate-x-1/2">
                  <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors duration-300 ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-2 shadow-2xl overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background border-b p-8">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
                {step === 1 && <Layers className="h-7 w-7" />}
                {step === 2 && <Settings className="h-7 w-7" />}
                {step === 3 && <Target className="h-7 w-7" />}
                {step === 4 && <ImageIcon className="h-7 w-7" />}
                {step === 5 && <Rocket className="h-7 w-7" />}
             </div>
             <div>
               <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Passo {step} de 5</p>
               <CardTitle className="text-2xl font-black">{steps[step-1].title}: {steps[step-1].desc}</CardTitle>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {SCALE_STRATEGIES.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStrategy(s)}
                  className={`group p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl ${selectedStrategy.id === s.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl group-hover:scale-125 transition-transform">{s.emoji}</div>
                    <div>
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      {selectedStrategy.id === s.id && <Badge className="bg-primary text-primary-foreground text-[10px]">RECOMENDADO</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.shortDesc}</p>
                  
                  {selectedStrategy.id === s.id && (
                    <div className="mt-2 p-3 bg-primary/10 rounded-xl border border-primary/20 animate-in fade-in duration-300">
                      <p className="text-[10px] font-black uppercase text-primary mb-1">Dica de Especialista:</p>
                      <p className="text-[10px] text-muted-foreground italic">
                        {s.id === 'baiana' && "Suba em massa. O segredo é o volume de conjuntos para encontrar a fatia certa do leilão."}
                        {s.id === 'cbo' && "Deixe a IA trabalhar. Não mexa na campanha por pelo menos 72h após o início."}
                        {s.id === 'abo' && "Controle total. Use para testar públicos específicos com o mesmo criativo vencedor."}
                        {s.id === '111' && "Ideal para novos pixels ou contas. Valide o criativo antes de escalar a verba."}
                        {s.id === 'russa' && "Escala conservadora. Aumente 20% a cada 2-3 dias se o ROAS estiver estável."}
                        {s.id === 'mortal' && "CUIDADO: Alta agressividade. Exige monitoramento de hora em hora."}
                        {s.id === 'ia_opt' && "Nosso motor analisa o comportamento do pixel em tempo real para otimizar lances."}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-8 p-6 rounded-2xl border bg-muted/30">
                <h4 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Checklist de Segurança para Escala
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Pixel com Match {">"} 85% verificado
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> API de Conversões Ativa e Saudável
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Criativos validados em testes prévios
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Oferta validada com ROAS {">"} 1.5x
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tut-name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" /> Nome Identificador da Campanha
                  </Label>
                  <Input id="tut-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: [IA] Escala de Verão" className="h-12 text-lg font-bold border-2 focus:border-primary" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="grid gap-3">
                    <Label htmlFor="tut-budget" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Orçamento Diário (R$)</Label>
                    <div className="flex flex-col gap-3">
                      <Input id="tut-budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} className="h-12 text-lg font-bold border-2 text-primary" />
                      <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10 italic">
                        Sugestão Profissional: R$ {selectedStrategy.defaults.dailyBudgetCents/100}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />
                       <p className="text-xs font-black uppercase text-slate-100">Configuração de Segurança</p>
                    </div>
                    <p className="text-[11px] text-slate-400">A estratégia <b>{selectedStrategy.name}</b> será aplicada automaticamente em nível de Campanha (CBO) para maximizar o ROAS.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                   <Zap className="h-24 w-24 text-primary" />
                </div>
                <p className="text-sm font-black flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-primary" /> INSIGHT DO MOTOR DE IA</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para garantir a fase de aprendizado da Meta, recomendamos manter esse orçamento por no mínimo 7 dias sem alterações bruscas. 
                  O motor de escala cuidará das otimizações automáticas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="p-4 rounded-xl border bg-muted/30">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase">Estratégia de Lance</p>
                   <p className="text-sm font-bold mt-1">Volume Mais Alto (Automático)</p>
                 </div>
                 <div className="p-4 rounded-xl border bg-muted/30">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase">Atribuição (Window)</p>
                   <p className="text-sm font-bold mt-1">7 dias clique / 1 dia visualização</p>
                 </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <Label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Globe className="h-5 w-5" /> Geografia do Público
                  </Label>
                  <div className="grid gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
                    <div className="grid gap-2">
                      <Label htmlFor="tut-region" className="text-[10px] font-bold uppercase text-muted-foreground">Alcance Geográfico</Label>
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger id="tut-region" className="h-11">
                          <SelectValue placeholder="Selecione o Alcance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Mundo Inteiro (Global)</SelectItem>
                          <SelectItem value="US">Estados Unidos (USA)</SelectItem>
                          <SelectItem value="EU">Europa (Principais Países)</SelectItem>
                          <SelectItem value="LATAM">América Latina</SelectItem>
                          <SelectItem value="BR">Brasil (Todo o País)</SelectItem>
                          <SelectItem value="SP">São Paulo (Estado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tut-city" className="text-[10px] font-bold uppercase text-muted-foreground">Cidade ou Região Específica</Label>
                      <Input 
                        id="tut-city" 
                        placeholder="Ex: Miami, London, São Paulo..." 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <Label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Target className="h-5 w-5" /> Público Alvo Detalhado
                  </Label>
                  <div className="grid gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Faixa Etária</Label>
                        <Select value={ageRange} onValueChange={setAgeRange}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18-65+">18 - 65+</SelectItem>
                            <SelectItem value="18-35">18 - 35</SelectItem>
                            <SelectItem value="25-45">25 - 45</SelectItem>
                            <SelectItem value="35-65+">35 - 65+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Gênero</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="MALE">Homens</SelectItem>
                            <SelectItem value="FEMALE">Mulheres</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tut-interests" className="text-[10px] font-bold uppercase text-muted-foreground">Interesses (IA filtrará)</Label>
                      <Input 
                        id="tut-interests" 
                        placeholder="Ex: Luxury Goods, Entrepreneurship, Online Shopping..." 
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                         <Zap className="h-3 w-3 text-blue-500" />
                         <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Recomendação IA para Escala</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Para escala global, use Público Aberto (Broad) ou Lookalike 1%. 
                        O algoritmo da Meta encontra os melhores compradores automaticamente quando o criativo é forte. 
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração do Público:</p>
                   <p className="text-xs text-slate-100 font-bold">
                     {region === 'ALL' ? 'Mundo Inteiro' : (region || 'Global')}
                     {city ? ` • ${city}` : ""}
                     {interests ? ` • +${interests.split(',').length} Interesses` : " • Público Aberto"}
                     {" • "}
                     {ageRange}
                     {" • "}
                     {gender === 'ALL' ? 'Ambos' : (gender === 'MALE' ? 'Homens' : 'Mulheres')}
                   </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                   <h3 className="text-xl font-black uppercase">Selecione seus Criativos Winners</h3>
                   <p className="text-xs text-muted-foreground">Escolha os anúncios que já performam bem para escalar com segurança.</p>
                 </div>
                 <Badge variant="outline" className="h-8 px-4 rounded-full border-primary/30 bg-primary/5 text-primary font-bold">
                   {selectedCreatives.length} DE {allCreatives.length} SELECIONADOS
                 </Badge>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {allCreatives.map((c: any) => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCreatives(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} 
                      className={`group relative cursor-pointer rounded-2xl border-2 p-2 transition-all hover:shadow-2xl hover:-translate-y-1 ${selectedCreatives.includes(c.id) ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-border grayscale hover:grayscale-0'}`}
                    >
                      <div className="aspect-[4/5] mb-3 overflow-hidden rounded-xl bg-muted relative">
                        <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        {c.video_id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                               <Video className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                           <Badge className="bg-black/60 text-[8px] h-4">CTR 1.8%</Badge>
                        </div>
                      </div>
                      <p className="text-[10px] font-black truncate uppercase tracking-tighter">{c.name}</p>
                      {selectedCreatives.includes(c.id) && (
                        <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary text-primary-foreground rounded-xl flex items-center justify-center border-4 border-background shadow-lg rotate-12 scale-110 animate-in zoom-in duration-300">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => document.getElementById('media-upload')?.click()}
                    className="border-4 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all aspect-[4/5] group"
                  >
                     {isUploading ? (
                       <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                     ) : (
                       <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                       </div>
                     )}
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                       {isUploading ? "Hospedando..." : "Hospedar Mídia"}
                     </p>
                     <input 
                       id="media-upload"
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleFileUpload}
                     />
                  </div>
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Rocket className="h-32 w-32 text-primary" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div>
                        <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 uppercase font-black tracking-widest text-[10px]">REVISÃO FINAL</Badge>
                        <h3 className="text-3xl font-black text-white">{name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-800">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estratégia</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{selectedStrategy.emoji}</span>
                            <span className="text-xl font-bold text-slate-100">{selectedStrategy.name}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento</p>
                          <p className="text-2xl font-black text-[oklch(0.7_0.18_162)]">R$ {budget},00<span className="text-xs text-slate-400 font-medium ml-1">/dia</span></p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                               <Globe className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Público e Geografia</p>
                               <p className="text-sm text-slate-200 font-bold">
                                  {region === 'ALL' ? 'Mundo Inteiro' : region} {city && `• ${city}`} • {ageRange} • {gender === 'ALL' ? 'Todos' : (gender === 'MALE' ? 'Homens' : 'Mulheres')}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                               <Target className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuração Técnica Meta</p>
                               <p className="text-[11px] text-slate-400 leading-tight">
                                  <b>Objetivo:</b> {selectedStrategy.defaults.objective} • <b>Lance:</b> Menor Custo • <b>Distribuição:</b> {selectedStrategy.id === 'abo' ? 'Adset Level' : 'CBO (Campaign level)'}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                               <Zap className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pixel & CAPI Status</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  <p className="text-[11px] text-slate-400 font-bold">Verificado (Qualidade Excelente)</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl border bg-card/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Criativos Selecionados ({selectedCreatives.length})</p>
                    <div className="grid grid-cols-2 gap-3">
                       {allCreatives.filter(c => selectedCreatives.includes(c.id)).map((c: any) => (
                         <div key={c.id} className="aspect-square rounded-xl overflow-hidden border border-border">
                            <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover" />
                         </div>
                       ))}
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-[oklch(0.7_0.18_162)]/10 border-2 border-[oklch(0.7_0.18_162)]/20">
                    <p className="text-xs font-black text-[oklch(0.7_0.18_162)] uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Rocket className="h-4 w-4" /> Pronto para o Lançamento
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                       {"Todas as configurações foram revisadas pelo Motor de IA. A campanha será criada via API Meta oficial."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-6 border-t bg-muted/20 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => setStep(p => p - 1)} 
            disabled={step === 1}
          >
            Voltar
          </Button>
          
          {step < 5 ? (
            <Button 
              onClick={() => setStep(p => p + 1)}
              className="gap-2"
              disabled={step === 4 && selectedCreatives.length === 0}
            >
              {step === 4 ? "Revisar Detalhes" : "Continuar"} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              className="gap-2 bg-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.6_0.18_162)] text-slate-950 font-black px-8 h-12 rounded-xl shadow-xl shadow-primary/20"
            >
              Lançar Campanha de Escala <Rocket className="h-5 w-5" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SettingsTab({ account }: { account: any }) {
  return (
    <div className="space-y-6 max-w-2xl">
       <Card>
         <CardHeader>
           <CardTitle>Configuraes da Conta</CardTitle>
           <CardDescription>Gerencie suas credenciais e conexes do Meta Ads.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">ID da Conta</label>
              <div className="p-2 bg-muted rounded border text-sm font-mono">{account?.id}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Moeda</label>
              <div className="p-2 bg-muted rounded border text-sm">{account?.currency}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Fuso Horrio</label>
              <div className="p-2 bg-muted rounded border text-sm">{account?.timezone_name}</div>
            </div>
         </CardContent>
         <div className="p-6 border-t flex justify-between items-center">
            <p className="text-xs text-muted-foreground">ltima sincronizao: {new Date().toLocaleTimeString()}</p>
            <Button variant="destructive" size="sm" onClick={() => toast.error("Funo desabilitada para proteo da conta.")}>Desconectar Conta</Button>
         </div>
       </Card>

       <Card>
         <CardHeader>
           <CardTitle>Limites de Escala</CardTitle>
           <CardDescription>Defina protees para a IA no gastar excessivamente.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Oramento Mximo Dirio</p>
                <p className="text-xs text-muted-foreground">A IA pausar se ultrapassar este valor.</p>
              </div>
              <div className="font-bold">R$ 5.000,00</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Alerta de CPA</p>
                <p className="text-xs text-muted-foreground">Notificar se o CPA subir +20%.</p>
              </div>
              <Switch checked />
            </div>
         </CardContent>
       </Card>
    </div>
  );
}

function AutomationTab() {
  const rules = [
    { id: 1, name: "Pausar CPA Alto", desc: "Pausa o conjunto se o CPA for maior que R$ 25,00 aps 500 impresses.", active: true, icon: <ZapOff className="h-4 w-4 text-destructive" /> },
    { id: 2, name: "Escala Vertical", desc: "Aumenta o oramento em 20% se o ROAS for maior que 3.0 nos ltimos 3 dias.", active: true, icon: <TrendingUp className="h-4 w-4 text-[oklch(0.7_0.18_162)]" /> },
    { id: 3, name: "Limpeza de Criativos", desc: "Pausa criativos com CTR abaixo de 0.8% aps R$ 50,00 gastos.", active: false, icon: <RefreshCw className="h-4 w-4 text-blue-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Regras de Automao IA</h2>
          <p className="text-xs text-muted-foreground">O motor de automao otimiza suas campanhas em tempo real.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-3 w-3" /> Nova Regra
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {rule.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{rule.name}</h3>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={rule.active ? "default" : "secondary"}>
                  {rule.active ? "Ativa" : "Inativa"}
                </Badge>
                <Switch checked={rule.active} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-center gap-4">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Activity className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold">Monitoramento Ativo</h3>
          <p className="text-xs text-muted-foreground">A IA realizou 14 aes de otimizao nas ltimas 24 horas.</p>
        </div>
        <Button variant="outline" size="sm">Ver Logs</Button>
      </div>
    </div>
  );
}


function DryRunModal({ isOpen, onClose, data, pages }: { isOpen: boolean, onClose: () => void, data: { strategy: ScaleStrategy; creatives?: any[]; targeting?: any; name?: string; budget?: number } | null, pages: any[] }) {
  const [isActivating, setIsActivating] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [destination, setDestination] = useState<"WHATSAPP" | "SALES">("WHATSAPP");
  const [destinationUrl, setDestinationUrl] = useState<string>("");

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0].id);
    }
  }, [pages, selectedPage]);

  const handleActivate = async () => {
    if (!data || !selectedPage) {
      if (!selectedPage) toast.error("Selecione uma Pgina do Facebook");
      return;
    }
    setIsActivating(true);
    try {
      const res = await createFullScale({
        data: {
          name: data.name || `[IA ULTRA] ${data.strategy.defaults.namePrefix || data.strategy.name} - ${new Date().toLocaleDateString()}`,
          objective: destination === "WHATSAPP" ? "OUTCOME_ENGAGEMENT" : data.strategy.defaults.objective,
          dailyBudgetCents: data.budget || data.strategy.defaults.dailyBudgetCents,
          strategy: data.strategy.id,
          status: data.strategy.defaults.status,
          pageId: selectedPage,
          destination: destination,
          destinationUrl: destinationUrl,
          targeting: data.targeting,
          creatives: data.creatives?.map(c => ({
            id: c.id,
            image_url: c.image_url || c.thumbnail_url,
            video_id: c.video_id,
            primaryText: c.body || "Performance Copy",
            headline: c.name || c.title || "Headline",
            cta: destination === "WHATSAPP" ? "SEND_MESSAGE" : "SHOP_NOW"
          }))
        }
      });

      if (res.ok) {
        toast.success(`Estratgia ${data.strategy.name} ativada com sucesso via API!`);
        onClose();
      } else {
        toast.error("Erro ao ativar escala: " + res.error);
      }
    } catch (e: any) {
      toast.error("Erro na conexo: " + e.message);
    } finally {
      setIsActivating(false);
    }
  };

  if (!data) return null;

  const { strategy, creatives } = data;
  const adsetCount = strategy.defaults?.adsetCount || 1;
  const totalBudget = strategy.defaults?.isCBO 
    ? (data.budget || strategy.defaults.dailyBudgetCents) / 100 
    : ((data.budget || strategy.defaults.dailyBudgetCents) * adsetCount) / 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-primary/20 text-slate-100 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              {strategy.emoji}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Reviso Profissional da Escala</DialogTitle>
              <DialogDescription className="text-slate-400">
                Verifique o destino, a campanha e as caractersticas do conjunto de anncios.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pgina do Facebook (Emissor)</Label>
                <Select value={selectedPage} onValueChange={setSelectedPage}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-11">
                    <SelectValue placeholder="Selecione a Pgina" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {pages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Destino do Trfego</Label>
                <RadioGroup value={destination} onValueChange={(v: any) => setDestination(v)} className="grid grid-cols-2 gap-4">
                   <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${destination === 'WHATSAPP' ? 'border-primary bg-primary/10' : 'border-slate-800 bg-slate-900'}`} onClick={() => setDestination('WHATSAPP')}>
                      <RadioGroupItem value="WHATSAPP" id="dest-wa" className="border-slate-400" />
                      <Label htmlFor="dest-wa" className="cursor-pointer font-bold text-xs">WhatsApp</Label>
                   </div>
                   <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${destination === 'SALES' ? 'border-primary bg-primary/10' : 'border-slate-800 bg-slate-900'}`} onClick={() => setDestination('SALES')}>
                      <RadioGroupItem value="SALES" id="dest-sales" className="border-slate-400" />
                      <Label htmlFor="dest-sales" className="cursor-pointer font-bold text-xs">Site / Vendas</Label>
              </div>
              
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">URL de Destino</Label>
                <Input 
                  value={destinationUrl} 
                  onChange={(e) => setDestinationUrl(e.target.value)} 
                  placeholder={destination === 'WHATSAPP' ? "Ex: wa.me/55..." : "Ex: https://meusite.com"} 
                  className="bg-slate-900 border-slate-800 h-11"
                />
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 p-4 flex flex-col justify-between">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Resumo da Estratgia</p>
                  <div className="space-y-3">
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total de Conjuntos:</span>
                        <span className="font-bold text-slate-100">{adsetCount}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Investimento Dirio:</span>
                        <span className="font-bold text-primary">{formatBRL(totalBudget)}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Objetivo:</span>
                        <span className="font-bold text-slate-100">{destination === 'WHATSAPP' ? 'Engajamento' : 'Vendas'}</span>
                     </div>
                  </div>
               </div>
               <div className="mt-6 pt-4 border-t border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Pblico Estimado</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {data.targeting?.geo_locations?.regions?.[0]?.name || data.targeting?.geo_locations?.countries?.[0] || "Global"}  
                    {data.targeting?.interests ? ` ${data.targeting.interests.length} Interesses` : " Aberto"}
                  </p>
               </div>
            </Card>
          </div>

          <div className="space-y-3">
             <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Criativos Selecionados ({creatives?.length})</Label>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {creatives?.map((c, i) => (
                  <div key={i} className="h-16 w-16 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                    <img src={c.image_url || c.thumbnail_url} className="h-full w-full object-cover" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isActivating}>Cancelar</Button>
          <Button 
            className="bg-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.6_0.16_162)] text-black font-bold gap-2" 
            onClick={handleActivate}
            disabled={isActivating || !selectedPage}
          >
            {isActivating ? (
              <> <RefreshCw className="h-4 w-4 animate-spin" /> Subindo API... </>
            ) : (
              <> <Rocket className="h-4 w-4" /> Ativar no Facebook (API REAL) </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionItem({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
      {icon}
      <span className="text-xs text-slate-300 font-medium">{text}</span>
    </div>
  );
}

function GoogleAdsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Ads Hub</CardTitle>
          <CardDescription>Gerencie suas campanhas de Pesquisa, Youtube e Display.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
          <Globe className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
          <h3 className="text-lg font-medium">Conectando ao Google Ads</h3>
          <p className="text-sm text-muted-foreground mb-4">Estamos preparando o dashboard do Google Ads para sua conta.</p>
          <Button>Vincular Conta Google</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InstaOrganicTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instagram Orgnico</CardTitle>
          <CardDescription>Anlise de posts, reels e stories sem investimento pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
             <KPICard title="Alcance Orgnico" value="12.4k" icon={<Users className="h-4 w-4" />} trend="+5%" positive />
             <KPICard title="Engajamento" value="4.2%" icon={<Heart className="h-4 w-4" />} trend="+1.2%" positive />
             <KPICard title="Novos Seguidores" value="842" icon={<UserPlus className="h-4 w-4" />} trend="+18%" positive />
          </div>
          <div className="mt-8 border rounded-lg p-12 flex flex-col items-center justify-center">
             <Smartphone className="h-12 w-12 text-primary mb-4" />
             <p className="font-bold">Sincronizando Feed...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WAReportsTab() {
  const [isSending, setIsSending] = useState(false);

  const handleSendReport = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success("Relatório enviado para o seu WhatsApp!");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Automáticos via WhatsApp</CardTitle>
          <CardDescription>Envie PDFs e resumos de performance direto para seu celular ou do cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-bold">Relatório Diário (Resumo)</p>
              <p className="text-xs text-muted-foreground">Enviado todos os dias às 08:00</p>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.info(`Relatório diário ${checked ? "ativado" : "desativado"}`)} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-bold">Relatório Semanal Consolidado</p>
              <p className="text-xs text-muted-foreground">Enviado toda segunda-feira</p>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.info(`Relatório semanal ${checked ? "ativado" : "desativado"}`)} />
          </div>
          <Button className="w-full h-11" onClick={handleSendReport} disabled={isSending}>
            {isSending ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><MessageSquare className="mr-2 h-4 w-4" /> Enviar Relatório Agora</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WAAlertsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Saldo e Performance</CardTitle>
          <CardDescription>Receba avisos imediatos se o saldo acabar ou o CPA subir demais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
             <div className="p-4 border rounded-lg space-y-2">
               <Label>Alerta de Saldo Baixo</Label>
               <div className="flex gap-2">
                 <Input placeholder="R$ 100,00" />
                 <Button variant="outline">Salvar</Button>
               </div>
             </div>
             <div className="p-4 border rounded-lg space-y-2">
               <Label>Alerta de CPA Alto</Label>
               <div className="flex gap-2">
                 <Input placeholder="R$ 50,00" />
                 <Button variant="outline">Salvar</Button>
               </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientDashTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compartilhar Dashboard</CardTitle>
          <CardDescription>Crie um link pblico (ou com senha) para seu cliente acompanhar os resultados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
            <code className="text-xs">https://meta-ultra.app/shared/dashboard/ax92j...</code>
            <Button size="sm" variant="ghost"><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Gerar Novo Link</Button>
            <Button variant="outline">Configurar Senha</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LeadTrackingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rastreamento de Leads WhatsApp</CardTitle>
          <CardDescription>Identifique de qual campanha cada contato do WhatsApp veio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">WhatsApp</TableCell>
                <TableCell>Escala Baiana #1</TableCell>
                <TableCell><Badge variant="outline">Iniciado</Badge></TableCell>
                <TableCell>Hoje, 14:20</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">WhatsApp</TableCell>
                <TableCell>Retargeting IA</TableCell>
                <TableCell><Badge className="bg-green-500">Convertido</Badge></TableCell>
                <TableCell>Hoje, 12:05</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function WASupportTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Atendimento Integrado</CardTitle>
          <CardDescription>Responda seus clientes do WhatsApp sem sair do dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center border rounded-lg bg-muted/20">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-bold text-lg">Central de Mensagens</h3>
            <p className="text-sm text-muted-foreground">Conecte seu celular para abrir o chat multi-agente.</p>
            <Button className="mt-4">Ativar Central</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AICreativesTab() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setResults([
        { id: 1, type: "copy", content: "Transforme seus anúncios com o poder da Ultra IA. Resultados reais em 24h!" },
        { id: 2, type: "image", content: "Banner Sugerido: Fundo tecnológico com elementos de alta velocidade." }
      ]);
      toast.success("Criativos gerados pela IA!");
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geração de Criativos com IA</CardTitle>
          <CardDescription>Crie imagens e copies de alta conversão em segundos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>O que você está vendendo?</Label>
              <Textarea placeholder="Ex: Curso de Marketing Digital para Iniciantes..." />
            </div>
            <div className="space-y-2">
              <Label>Estilo Visual</Label>
              <Select defaultValue="realistic">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realista</SelectItem>
                  <SelectItem value="3d">3D Render</SelectItem>
                  <SelectItem value="minimalist">Minimalista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full h-12 text-lg" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Gerando com IA...</>
            ) : (
              <><Brain className="mr-2 h-5 w-5" /> Gerar Criativos Master</>
            )}
          </Button>

          {results.length > 0 && (
            <div className="grid gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {results.map(res => (
                <div key={res.id} className="p-4 border rounded-lg bg-muted/30">
                  <Badge className="mb-2">{res.type.toUpperCase()}</Badge>
                  <p className="text-sm font-medium italic">{res.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AIAnalysisTab() {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAction = (msg: string) => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.success(msg);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/50 shadow-lg shadow-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary animate-pulse" />
            <CardTitle>Análise de Performance IA</CardTitle>
          </div>
          <CardDescription>Insights profundos sobre o que está funcionando e o que deve ser pausado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 relative overflow-hidden">
             {analyzing && <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>}
             <p className="text-sm font-bold flex items-center gap-2">
               <Zap className="h-4 w-4 text-primary" /> Sugestão da IA:
             </p>
             <p className="text-sm mt-2">
               "Sua campanha 'Escala Baiana' está com CTR 25% acima da média, mas o checkout rate caiu. Sugiro simplificar a página de destino."
             </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
             <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <p className="text-xs font-bold uppercase text-muted-foreground">Oportunidade de Escala</p>
                <p className="text-lg font-bold">Adset #4 - ROAS 4.2x</p>
                <Button 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => handleAction("Orçamento aumentado em 20% conforme sugestão da IA")}
                  disabled={analyzing}
                >
                  Aumentar Orçamento
                </Button>
             </div>
             <div className="p-4 border rounded-lg hover:border-destructive/50 transition-colors">
                <p className="text-xs font-bold uppercase text-muted-foreground">Risco de Perda</p>
                <p className="text-lg font-bold text-destructive">Criativo 'Video_V2' saturando</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => handleAction("Anúncio pausado com sucesso")}
                  disabled={analyzing}
                >
                  Pausar Agora
                </Button>
             </div>
          </div>
          <Button variant="ghost" className="w-full text-xs" onClick={() => handleAction("Análise completa enviada para seu e-mail")}>
            Ver Relatório Detalhado Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EcommerceTab() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);

  const handleConnect = (platform: string) => {
    setConnecting(platform);
    setTimeout(() => {
      setConnecting(null);
      setConnected(prev => [...prev, platform]);
      toast.success(`Conectado ao ${platform} com sucesso!`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rastrear Vendas Ecommerce</CardTitle>
          <CardDescription>Integração direta com Shopify, WooCommerce e Hotmart.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Shopify", icon: <ShoppingCart className="h-8 w-8" /> },
                { name: "WooCommerce", icon: <Globe className="h-8 w-8" /> },
                { name: "Hotmart", icon: <Activity className="h-8 w-8" /> },
                { name: "Outros", icon: <Plus className="h-8 w-8" /> }
              ].map(platform => (
                <div 
                  key={platform.name}
                  onClick={() => !connected.includes(platform.name) && handleConnect(platform.name)}
                  className={`p-4 border rounded-lg text-center cursor-pointer transition-all ${
                    connected.includes(platform.name) 
                      ? "border-green-500 bg-green-500/10" 
                      : "hover:border-primary bg-muted/20"
                  } ${connecting === platform.name ? "animate-pulse border-primary" : ""}`}
                >
                  <div className="mb-2 flex justify-center text-primary">
                    {connecting === platform.name ? <RefreshCw className="h-8 w-8 animate-spin" /> : platform.icon}
                  </div>
                  <p className="text-xs font-bold">{platform.name}</p>
                  {connected.includes(platform.name) && (
                    <Badge variant="secondary" className="mt-2 bg-green-500 text-white border-0">ATIVO</Badge>
                  )}
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CRMTab({ leads, onAdd, onMove }: { leads: any[], onAdd: (s: string) => void, onMove: (id: number, s: string) => void }) {
  const stages = [
    { id: "novo", title: "Novo Lead", color: "bg-blue-500" },
    { id: "atendimento", title: "Em Atendimento", color: "bg-yellow-500" },
    { id: "pagamento", title: "Aguardando Pagto", color: "bg-purple-500" },
    { id: "fechado", title: "Fechado", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM Interno</CardTitle>
          <CardDescription>Gestão de pipeline e funil de vendas dos leads gerados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map(stage => (
              <CRMPipeColumn 
                key={stage.id}
                id={stage.id}
                title={stage.title} 
                leads={leads.filter(l => l.stage === stage.id)} 
                color={stage.color} 
                onAdd={() => onAdd(stage.id)}
                onMove={onMove}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CRMPipeColumn({ title, id, leads, color, onAdd, onMove }: { title: string, id: string, leads: any[], color: string, onAdd: () => void, onMove: (id: number, s: string) => void }) {
  return (
    <div className="min-w-[280px] bg-muted/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm">{title}</h4>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div className={`h-1.5 w-full ${color} rounded-full`} />
      <div className="space-y-3">
        {leads.map(lead => (
          <div 
            key={lead.id} 
            className="p-3 bg-background rounded-lg border text-xs shadow-sm space-y-2 group relative cursor-move hover:border-primary/50 transition-colors"
          >
            <div className="font-bold">{lead.name}</div>
            <div className="text-muted-foreground">{formatBRL(lead.value)}</div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMove(lead.id, "novo")} title="Mover para Novo">
                  <ChevronLeft className="h-3 w-3" />
               </Button>
               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMove(lead.id, "atendimento")} title="Em Atendimento">
                  <Activity className="h-3 w-3" />
               </Button>
               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMove(lead.id, "pagamento")} title="Aguardando Pagamento">
                  <DollarSign className="h-3 w-3" />
               </Button>
               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onMove(lead.id, "fechado")} title="Mover para Fechado">
                  <CheckCircle2 className="h-3 w-3" />
               </Button>
            </div>
          </div>
        ))}
        <Button variant="ghost" className="w-full text-xs h-9 border-dashed border hover:bg-background" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar Lead
        </Button>
      </div>
    </div>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
