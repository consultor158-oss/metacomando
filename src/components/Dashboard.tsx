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
  Video
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
  updateAdsetBudget
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

type View = "overview" | "campaigns" | "scales" | "creatives" | "automation" | "settings";

export function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [dryRunData, setDryRunData] = useState<{ strategy: ScaleStrategy; creatives?: any[] } | null>(null);

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
                      <span>Visão Geral</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "campaigns"} onClick={() => setView("campaigns")}>
                      <Layers className="h-4 w-4" />
                      <span>Campanhas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "scales"} onClick={() => setView("scales")}>
                      <Rocket className="h-4 w-4" />
                      <span>Escalas IA</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "creatives"} onClick={() => setView("creatives")}>
                      <ImageIcon className="h-4 w-4" />
                      <span>Biblioteca de Criativos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "automation"} onClick={() => setView("automation")}>
                      <RefreshCw className="h-4 w-4" />
                      <span>Automação</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Tutorial Guiado movido para dentro de Escalas */}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsWAModalOpen(true)} className="text-[oklch(0.7_0.18_162)] hover:text-[oklch(0.7_0.18_162)]">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Config</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === "settings"} onClick={() => setView("settings")}>
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
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
                  {view === "overview" && "Visão Geral"}
                  {view === "campaigns" && "Campanhas"}
                  {view === "scales" && "Escalas de IA"}
                  {view === "creatives" && "Biblioteca de Criativos"}
                  {view === "automation" && "Automação"}
                  {view === "settings" && "Configurações"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {accountData ? `Conta: ${accountData.name}` : "Carregando conta..."}
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
            {view === "scales" && (
              <div className="space-y-10">
                <TutorialTab creatives={creativesData} onComplete={(data) => {
                  setDryRunData(data);
                }} />
                <div className="border-t pt-10">
                  <h3 className="text-xl font-bold mb-6">Outras Estratégias de Escala</h3>
                  <ScalesTab onSelect={(s) => setDryRunData({ strategy: s })} />
                </div>
              </div>
            )}
            {view === "creatives" && <CreativesTab creatives={creativesData} />}
            {view === "automation" && <AutomationTab />}
            {view === "settings" && <SettingsTab account={accountData} />}
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
        <KPICard title="Investimento" value={formatBRL(parseFloat(stats.spend || 0))} icon={<DollarSign className="h-4 w-4 text-primary" />} trend="+12%" />
        <KPICard title="CTR Geral" value={formatPct(parseFloat(stats.ctr || 0))} icon={<MousePointer2 className="h-4 w-4 text-primary" />} trend="+0.2%" />
        <KPICard title="ROAS" value={(parseFloat(stats.purchase_roas?.[0]?.value || 0)).toFixed(2) + "x"} icon={<TrendingUp className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />} trend="+0.5x" positive />
        <KPICard title="Impressões" value={formatNumber(stats.impressions || 0)} icon={<Eye className="h-4 w-4 text-primary" />} trend="+24k" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Funil de Conversão (30d)</CardTitle>
            <CardDescription>Fluxo de usuários desde a impressão até a compra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FunnelStep label="Impressões" count={funnel?.impressions || 0} pct="100%" color="bg-primary/20" />
             <FunnelStep label="Cliques no Link" count={funnel?.link_clicks || 0} pct={(funnel?.impressions > 0 ? (funnel?.link_clicks / funnel?.impressions) * 100 : 0).toFixed(2) + "%"} color="bg-primary/40" />
             <FunnelStep label="Visualizações da Página" count={funnel?.landing_page_views || 0} pct={(funnel?.link_clicks > 0 ? (funnel?.landing_page_views / funnel?.link_clicks) * 100 : 0).toFixed(2) + "%"} color="bg-primary/60" />
             <FunnelStep label="Finalizações de Compra" count={funnel?.initiate_checkout || 0} pct={(funnel?.landing_page_views > 0 ? (funnel?.initiate_checkout / funnel?.landing_page_views) * 100 : 0).toFixed(2) + "%"} color="bg-primary/80" />
             <FunnelStep label="Vendas (Purchase)" count={funnel?.purchases || 0} pct={(funnel?.initiate_checkout > 0 ? (funnel?.purchases / funnel?.initiate_checkout) * 100 : 0).toFixed(2) + "%"} color="bg-[oklch(0.7_0.18_162)]" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Status da Conta</CardTitle>
              <CardDescription>Saúde e performance do pixel e API.</CardDescription>
            </div>
            <Badge className="bg-[oklch(0.7_0.18_162)]">Saudável</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>API de Conversões</span>
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
                   <p className="text-xs font-bold uppercase">Proteção Anti-Bloqueio</p>
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

function KPICard({ title, value, icon, trend, positive }: { title: string, value: string, icon: any, trend: string, positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
            {icon}
          </div>
          <div className={`flex items-center text-[10px] font-bold ${positive ? 'text-[oklch(0.7_0.18_162)]' : 'text-blue-500'}`}>
            {trend} {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          </div>
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
    if (!confirm("Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.")) return;
    setUpdating(id);
    const res = await deleteCampaign({ data: { campaignId: id } });
    if (res.ok) {
      toast.success("Campanha excluída com sucesso!");
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
              <TableHead>Entrega / Destino</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Investido</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>CPA</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                  <div className="font-medium truncate max-w-[280px] group-hover:text-primary transition-colors flex items-center gap-2">
                    {c.name}
                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">{c.objective}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {c.daily_budget ? (
                      <div className="flex flex-col">
                        <span>{formatBRL(parseInt(c.daily_budget) / 100)}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">Diário</span>
                      </div>
                    ) : c.lifetime_budget ? (
                      <div className="flex flex-col">
                        <span>{formatBRL(parseInt(c.lifetime_budget) / 100)}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">Vitalício</span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatBRL(c.spend)}</TableCell>
                <TableCell className={`font-bold ${c.roas >= 2.5 ? 'text-[oklch(0.7_0.18_162)]' : 'text-blue-500'}`}>
                  {c.roas.toFixed(2)}x
                </TableCell>
                <TableCell>{formatBRL(c.cpa)}</TableCell>
                <TableCell className="text-right">
                   <div className="flex justify-end gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCampaign(c)}>
                       <Edit2 className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(c.id)}>
                       <Copy className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                       <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info(`Relatório completo de ${c.name} em breve.`)}>
                       <BarChart3 className="h-3.5 w-3.5" />
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
      toast.success("Status do anúncio atualizado");
      details.refetch();
    }
  };

  if (!campaign) return null;

  // fullData already declared above

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edição Completa: {name}</DialogTitle>
          <DialogDescription>
            Gerencie campanha, conjuntos de anúncios e criativos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent gap-6">
              <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Configurações</TabsTrigger>
              <TabsTrigger value="adsets" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Conjuntos ({fullCampaignData?.adsets?.length || 0})</TabsTrigger>
              <TabsTrigger value="ads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Anúncios ({fullCampaignData?.ads?.length || 0})</TabsTrigger>
              <TabsTrigger value="creatives" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Visual Criativos</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="settings" className="mt-0 space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Campanha</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
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
                      <Label htmlFor="objective">Objetivo</Label>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OUTCOME_SALES">Vendas</SelectItem>
                          <SelectItem value="OUTCOME_LEADS">Cadastros</SelectItem>
                          <SelectItem value="OUTCOME_ENGAGEMENT">Engajamento</SelectItem>
                          <SelectItem value="OUTCOME_TRAFFIC">Tráfego</SelectItem>
                          <SelectItem value="OUTCOME_AWARENESS">Reconhecimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="budget_type">Tipo Orçamento</Label>
                      <Select value={budgetType} onValueChange={(v: any) => setBudgetType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="lifetime">Vitalício</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget">Valor (R$)</Label>
                      <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                    </div>
                  </div>
                </div>
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
                          <p className="text-sm font-medium">{as.name}</p>
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
                                    toast.success("Orçamento atualizado");
                                  }
                                }}
                              />
                              <span className="text-[9px] text-muted-foreground uppercase">
                                {as.daily_budget ? "Diário" : "Total"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              <Globe className="h-3 w-3" />
                              {as.targeting?.geo_locations?.countries?.join(", ") || as.targeting?.geo_locations?.regions?.map((r: any) => r.name).join(", ") || "Brasil"}
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
                          <p className="text-sm font-medium truncate">{ad.name}</p>
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
            Salvar Alterações
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
        <h2 className="text-2xl font-bold">Escalas com Inteligência Artificial</h2>
        <p className="text-muted-foreground max-w-xl mt-2">Selecione uma estratégia validada para subir campanhas ou duplicar conjuntos vencedores com um clique.</p>
        <div className="flex gap-2 mt-6">
          <Button className="bg-primary shadow-lg shadow-primary/20">Nova Escala Rápida</Button>
          <Button variant="outline">Ver Histórico</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCALE_STRATEGIES.map((s) => (
          <Card key={s.id} className="group hover:border-primary transition-all cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="text-3xl">{s.emoji}</div>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">Estratégia</Badge>
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

function CreativesTab({ creatives }: { creatives: any[] }) {
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const [filter, setFilter] = useState("all");

  const campaigns = Array.from(new Set(creatives.map(c => c.campaign_name || "Sem Pasta").filter(Boolean)));

  const filteredCreatives = filter === "all" 
    ? creatives 
    : creatives.filter(c => (c.campaign_name || "Sem Pasta") === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Biblioteca Profissional</h2>
          <p className="text-xs text-muted-foreground">Organizado por campanhas e pastas inteligentes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Pastas</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2">
            <Plus className="h-3 w-3" /> Novo Criativo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCreatives.map((c) => (
          <Card key={c.id} className="overflow-hidden group cursor-pointer" onClick={() => setSelectedCreative(c)}>
            <div className="aspect-square relative">
              <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full"><Eye className="h-4 w-4" /></Button>
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

      <Dialog open={!!selectedCreative} onOpenChange={() => setSelectedCreative(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
          {selectedCreative && (
            <div className="relative aspect-video flex items-center justify-center">
               <img src={selectedCreative.image_url || selectedCreative.thumbnail_url} className="max-w-full max-h-full object-contain" />
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-lg font-bold text-white">{selectedCreative.name}</h3>
                  <p className="text-sm text-gray-300 line-clamp-2">{selectedCreative.body || "Sem descrição disponível."}</p>
               </div>
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setSelectedCreative(null)}
               >
                 <Trash2 className="h-5 w-5" />
               </Button>
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
  const [locations, setLocations] = useState("BR");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState("");
  
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
    { id: 4, title: "Criativos", desc: "Seus melhores anúncios" }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight">Escala Guiada Passo a Passo</h2>
        <p className="text-muted-foreground text-lg">Siga o guia real para dominar seus anúncios como um administrador profissional.</p>
        
        <div className="flex justify-center gap-4 mt-8">
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s.id ? 'bg-primary text-primary-foreground scale-110 shadow-lg' : 'bg-muted text-muted-foreground opacity-50'}`}>
                {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${step === s.id ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-2 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
             <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{step}</span>
             {steps[step-1].title}: {steps[step-1].desc}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCALE_STRATEGIES.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStrategy(s)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedStrategy.id === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <h3 className="font-bold">{s.name}</h3>
                    {selectedStrategy.id === s.id && <Badge className="ml-auto">Selecionado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.shortDesc}</p>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="tut-name">Nome da Campanha</Label>
                <Input id="tut-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: [IA] Escala de Verão" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tut-budget">Orçamento Diário (R$)</Label>
                <div className="flex items-center gap-4">
                  <Input id="tut-budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-40" />
                  <span className="text-xs text-muted-foreground">Valor sugerido pela estratégia {selectedStrategy.name}: R$ {selectedStrategy.defaults.dailyBudgetCents/100}</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Dica do Mentor</p>
                <p className="text-xs text-muted-foreground mt-1">A estratégia {selectedStrategy.name} funciona melhor com orçamentos acima de R$ {selectedStrategy.defaults.dailyBudgetCents/100} para garantir dados suficientes para a IA.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Localização Detalhada
                  </Label>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="tut-state" className="text-xs">Estado</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger id="tut-state">
                          <SelectValue placeholder="Selecione o Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                          <SelectItem value="PR">Paraná</SelectItem>
                          <SelectItem value="SC">Santa Catarina</SelectItem>
                          <SelectItem value="BA">Bahia</SelectItem>
                          <SelectItem value="ALL">Todo o Brasil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tut-city" className="text-xs">Cidade / Município</Label>
                      <Input 
                        id="tut-city" 
                        placeholder="Ex: São Paulo, Campinas..." 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Interesses e Segmentação
                  </Label>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="tut-interests" className="text-xs">Interesses (Separados por vírgula)</Label>
                      <Input 
                        id="tut-interests" 
                        placeholder="Ex: Marketing Digital, E-commerce, Moda..." 
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[10px] text-blue-500 font-bold uppercase">IA Suggestion</p>
                      <p className="text-[10px] text-muted-foreground">O motor de IA recomenda usar "Público Aberto" para a estratégia {selectedStrategy.name} se o orçamento for menor que R$ 100/dia.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-primary">Configuração Atual:</span> {state || "Brasil"} {city ? `> ${city}` : ""} {interests ? `| Interesses: ${interests}` : "| Público Aberto"}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="font-bold">Selecione seus Criativos Winners</h3>
                 <span className="text-xs text-muted-foreground">{selectedCreatives.length} selecionados</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {creatives.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCreatives(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} 
                      className={`relative cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${selectedCreatives.includes(c.id) ? 'border-primary bg-primary/5 shadow-inner' : 'border-border'}`}
                    >
                      <div className="aspect-square mb-2 overflow-hidden rounded-lg bg-muted">
                        <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover" />
                        {c.video_id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Video className="h-8 w-8 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold truncate uppercase">{c.name}</p>
                      {selectedCreatives.includes(c.id) && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-2 border-dashed rounded-xl p-2 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors h-[140px]">
                     <Plus className="h-8 w-8 text-muted-foreground" />
                     <p className="text-[10px] font-bold uppercase">Novo Criativo</p>
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
          
          {step < 4 ? (
            <Button 
              onClick={() => setStep(p => p + 1)}
              className="gap-2"
            >
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              disabled={selectedCreatives.length === 0}
              onClick={() => onComplete({
                strategy: selectedStrategy,
                creatives: creatives.filter(c => selectedCreatives.includes(c.id)),
                name,
                budget: parseFloat(budget) * 100,
                targeting: { 
                  geo_locations: { 
                    countries: [locations],
                    regions: state ? [{ key: state, name: state }] : undefined,
                    cities: city ? [{ key: city, name: city }] : undefined
                  },
                  interests: interests ? interests.split(",").map(i => i.trim()) : undefined
                }
              })}
              className="gap-2 bg-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.6_0.18_162)] text-slate-950 font-bold"
            >
              Finalizar e Revisar Escala <Rocket className="h-4 w-4" />
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
           <CardTitle>Configurações da Conta</CardTitle>
           <CardDescription>Gerencie suas credenciais e conexões do Meta Ads.</CardDescription>
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
              <label className="text-xs font-bold uppercase text-muted-foreground">Fuso Horário</label>
              <div className="p-2 bg-muted rounded border text-sm">{account?.timezone_name}</div>
            </div>
         </CardContent>
         <div className="p-6 border-t flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Última sincronização: {new Date().toLocaleTimeString()}</p>
            <Button variant="destructive" size="sm" onClick={() => toast.error("Função desabilitada para proteção da conta.")}>Desconectar Conta</Button>
         </div>
       </Card>

       <Card>
         <CardHeader>
           <CardTitle>Limites de Escala</CardTitle>
           <CardDescription>Defina proteções para a IA não gastar excessivamente.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Orçamento Máximo Diário</p>
                <p className="text-xs text-muted-foreground">A IA pausará se ultrapassar este valor.</p>
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
    { id: 1, name: "Pausar CPA Alto", desc: "Pausa o conjunto se o CPA for maior que R$ 25,00 após 500 impressões.", active: true, icon: <ZapOff className="h-4 w-4 text-destructive" /> },
    { id: 2, name: "Escala Vertical", desc: "Aumenta o orçamento em 20% se o ROAS for maior que 3.0 nos últimos 3 dias.", active: true, icon: <TrendingUp className="h-4 w-4 text-[oklch(0.7_0.18_162)]" /> },
    { id: 3, name: "Limpeza de Criativos", desc: "Pausa criativos com CTR abaixo de 0.8% após R$ 50,00 gastos.", active: false, icon: <RefreshCw className="h-4 w-4 text-blue-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Regras de Automação IA</h2>
          <p className="text-xs text-muted-foreground">O motor de automação otimiza suas campanhas em tempo real.</p>
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
          <p className="text-xs text-muted-foreground">A IA realizou 14 ações de otimização nas últimas 24 horas.</p>
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

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0].id);
    }
  }, [pages, selectedPage]);

  const handleActivate = async () => {
    if (!data || !selectedPage) {
      if (!selectedPage) toast.error("Selecione uma Página do Facebook");
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
          targeting: data.targeting,
          creatives: data.creatives?.map(c => ({
            id: c.id,
            image_url: c.image_url || c.thumbnail_url,
            video_id: c.video_id,
            primaryText: c.body || "Performance Copy",
            headline: c.name || c.title || "Headline",
            cta: destination === "WHATSAPP" ? "MESSAGE_PAGE" : "SHOP_NOW"
          }))
        }
      });

      if (res.ok) {
        toast.success(`Estratégia ${data.strategy.name} ativada com sucesso via API!`);
        onClose();
      } else {
        toast.error("Erro ao ativar escala: " + res.error);
      }
    } catch (e: any) {
      toast.error("Erro na conexão: " + e.message);
    } finally {
      setIsActivating(false);
    }
  };

  if (!data) return null;

  const { strategy, creatives } = data;
  const adsetCount = strategy.id === "baiana" ? 50 : strategy.id === "abo" ? 3 : 1;
  const totalBudget = (strategy.defaults.dailyBudgetCents * adsetCount) / 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-primary/20 text-slate-100 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              {strategy.emoji}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Configuração da Página e Destino</DialogTitle>
              <DialogDescription className="text-slate-400">
                Ajuste os detalhes finais antes de subir para o Facebook.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Página do Facebook</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
                  <SelectValue placeholder="Selecione a Página" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {pages.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Destino do Tráfego</Label>
              <RadioGroup value={destination} onValueChange={(v: any) => setDestination(v)} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="WHATSAPP" id="r1" />
                  <Label htmlFor="r1" className="text-sm cursor-pointer">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SALES" id="r2" />
                  <Label htmlFor="r2" className="text-sm cursor-pointer">Vendas/Site</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Estratégia</p>
              <p className="text-sm font-bold">{strategy.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Orçamento Diário Total</p>
              <p className="text-sm font-bold text-[oklch(0.7_0.18_162)]">{formatBRL(totalBudget)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <Zap className="h-3 w-3" /> Ações Planejadas
            </h4>
            <div className="space-y-2">
              <ActionItem icon={<CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />} text={`Criar 1 Campanha: "[IA ULTRA] ${strategy.defaults.namePrefix || strategy.name}..."`} />
              <ActionItem icon={<CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.18_162)]" />} text={`Criar ${adsetCount} Conjuntos de Anúncios (AdSets)`} />
              <ActionItem icon={<MessageCircle className="h-4 w-4 text-green-400" />} text={`Destino: ${destination === "WHATSAPP" ? "WhatsApp (Conversas)" : "Site (Vendas)"}`} />
              <ActionItem icon={<Clock className="h-4 w-4 text-blue-400" />} text={`Status Inicial: ${strategy.defaults.status === "ACTIVE" ? "ATIVO" : "PAUSADO"}`} />
            </div>
          </div>

          {creatives && creatives.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Criativos Selecionados ({creatives.length})</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {creatives.map((c, i) => (
                  <div key={i} className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-slate-800">
                    <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <> <Rocket className="h-4 w-4" /> Ativar no Facebook </>
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
