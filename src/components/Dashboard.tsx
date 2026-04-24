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
  Save
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
  updateAdName
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
                      <span>Viso Geral</span>
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
                      <span>Automao</span>
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
                  <span>Configuraes</span>
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
                  {view === "campaigns" && "Campanhas"}
                  {view === "scales" && "Escalas de IA"}
                  {view === "creatives" && "Biblioteca de Criativos"}
                  {view === "automation" && "Automao"}
                  {view === "settings" && "Configuraes"}
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
                  <h3 className="text-xl font-bold mb-6">Outras Estratgias de Escala</h3>
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
        <KPICard title="Impresses" value={formatNumber(stats.impressions || 0)} icon={<Eye className="h-4 w-4 text-primary" />} trend="+24k" />
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
              <TabsTrigger value="ads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Anncios ({fullCampaignData?.ads?.length || 0})</TabsTrigger>
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
                          <SelectItem value="OUTCOME_TRAFFIC">Trfego</SelectItem>
                          <SelectItem value="OUTCOME_AWARENESS">Reconhecimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="budget_type" className="text-[10px] font-bold uppercase text-muted-foreground">Controle de Oramento</Label>
                      <Select value={budgetType} onValueChange={(v: any) => setBudgetType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Oramento Dirio</SelectItem>
                          <SelectItem value="lifetime">Oramento Vitalcio</SelectItem>
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
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Estratgia de Lance</Label>
                      <Badge variant="outline" className="w-fit">{fullCampaignData?.campaign?.bid_strategy || "Volume Mais Alto"}</Badge>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo de Compra</Label>
                      <Badge variant="outline" className="w-fit">{fullCampaignData?.campaign?.buying_type || "Leilo"}</Badge>
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
                    <div className="text-center py-10 text-muted-foreground">Carregando anncios...</div>
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

function CreativesTab({ creatives }: { creatives: any[] }) {
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const [filter, setFilter] = useState("CARBON");
  const [view, setView] = useState<"folders" | "files">("folders");
  const [editingCreative, setEditingCreative] = useState<any | null>(null);

  const organizedCreatives = creatives.map(c => ({ 
    ...c, 
    campaign_name: "CARBON",
    headline: c.headline || "Ttulo do Anncio",
    body: c.body || "Texto principal do anncio que aparece no feed.",
    link_url: c.link_url || "https://seulink.com"
  }));
  
  const campaigns = ["CARBON"];
  const filteredCreatives = organizedCreatives;

  const handleEdit = (creative: any) => {
    setSelectedCreative(creative);
    setEditingCreative({ ...creative });
  };

  const handleSave = () => {
    toast.success("Criativo atualizado com sucesso!");
    setSelectedCreative(null);
    setEditingCreative(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Biblioteca Profissional</h2>
          <p className="text-xs text-muted-foreground">Organizado por campanhas e pastas inteligentes.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === "files" && (
            <Button size="sm" variant="ghost" onClick={() => setView("folders")} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar para Pastas
            </Button>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Pasta" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Rocket className="h-3 w-3 text-primary" /> Escalar Criativos
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-3 w-3" /> Hospedar Mdia
          </Button>
        </div>
      </div>

      {view === "folders" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card 
            className="p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-all border-2 border-primary/20 bg-primary/5 group"
            onClick={() => setView("files")}
          >
            <div className="h-20 w-20 bg-primary/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <Folder className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-black text-base uppercase tracking-widest text-primary">CARBON</p>
              <Badge variant="outline" className="mt-1 text-[9px] border-primary/30 text-primary/70">{filteredCreatives.length} CRIATIVOS</Badge>
            </div>
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
  const [locations, setLocations] = useState("GLOBAL");
  const [region, setRegion] = useState("ALL");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState("");
  const [ageRange, setAgeRange] = useState("18-65+");
  const [gender, setGender] = useState("ALL");
  
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
        
        <div className="flex justify-center gap-4 mt-8 bg-muted/20 p-6 rounded-2xl border border-border/50">
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-3 w-24">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold transition-all ${step >= s.id ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20 rotate-3' : 'bg-muted text-muted-foreground opacity-50'}`}>
                {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
              </div>
              <div className="text-center">
                <span className={`text-[10px] font-black uppercase tracking-widest block ${step === s.id ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
                <span className="text-[8px] text-muted-foreground line-clamp-1 hidden md:block">{s.desc}</span>
              </div>
            </div>
          ))}
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
             </div>
             <div>
               <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Passo {step} de 4</p>
               <CardTitle className="text-2xl font-black">{steps[step-1].title}: {steps[step-1].desc}</CardTitle>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.shortDesc}</p>
                </div>
              ))}
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
                         <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Recomendação IA</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Para a estratégia <b>{selectedStrategy.name}</b>, o motor de IA sugere começar com "Público Aberto" para que o algoritmo do Meta encontre seus clientes mais rapidamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração do Público:</p>
                   <p className="text-xs text-slate-100 font-bold">{region === 'ALL' ? 'Mundo Inteiro' : (region || 'Global')} {city ? ` ${city}` : ""} {interests ? `+ ${interests.split(',').length} Interesses` : "+ Público Aberto"} • {ageRange} • {gender === 'ALL' ? 'Ambos' : (gender === 'MALE' ? 'Homens' : 'Mulheres')}</p>
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
                   {selectedCreatives.length} DE {creatives.length} SELECIONADOS
                 </Badge>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {creatives.map(c => (
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
                  <div className="border-4 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all aspect-[4/5] group">
                     <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Hospedar Mídia</p>
                  </div>
               </div>

               <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Rocket className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-100">Pronto para a Escala Ultra</p>
                        <p className="text-xs text-slate-400">Ao clicar em finalizar, o motor de IA criará a estrutura completa no seu Gerenciador de Anúncios.</p>
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
              onClick={() => {
                onComplete({
                  strategy: selectedStrategy,
                  creatives: creatives.filter(c => selectedCreatives.includes(c.id)),
                  name,
                  budget: Number(budget) * 100,
                  targeting: { 
                    geo_locations: { 
                      countries: region === 'ALL' ? undefined : [region],
                      regions: region !== 'ALL' && region !== 'BR' && region !== 'US' && region !== 'EU' && region !== 'LATAM' ? [{ key: region, name: region }] : undefined,
                      cities: city ? [{ key: city, name: city }] : undefined
                    },
                    interests: interests ? interests.split(",").map(i => i.trim()) : undefined,
                    age_min: ageRange.split("-")[0] ? parseInt(ageRange.split("-")[0]) : undefined,
                    age_max: ageRange.includes("+") ? undefined : (ageRange.split("-")[1] ? parseInt(ageRange.split("-")[1]) : undefined),
                    genders: gender === 'ALL' ? undefined : (gender === 'MALE' ? [1] : [2])
                  }
                });
              }}
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
                    {data.targeting?.geo_locations?.regions?.[0]?.name || "Todo o Brasil"}  
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
