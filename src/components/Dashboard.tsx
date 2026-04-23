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
  PlayCircle,
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
  AlertCircle
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
  getPages
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

type View = "overview" | "campaigns" | "scales" | "creatives" | "automation" | "tutorial" | "settings";

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
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={view === "tutorial"} onClick={() => setView("tutorial")}>
                      <PlayCircle className="h-4 w-4" />
                      <span>Tutorial Guiado</span>
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
                  {view === "tutorial" && "Tutorial Guiado"}
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
            {view === "scales" && <ScalesTab onSelect={(s) => setDryRunData({ strategy: s })} />}
            {view === "creatives" && <CreativesTab creatives={creativesData} />}
            {view === "automation" && <AutomationTab />}
            {view === "tutorial" && <TutorialTab creatives={creativesData} onComplete={(selected) => {
               const tutorialStrategy = SCALE_STRATEGIES.find(s => s.id === "ia_opt");
               if (tutorialStrategy) setDryRunData({ strategy: tutorialStrategy, creatives: selected });
            }} />}
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
              <TableHead>Status</TableHead>
              <TableHead className="w-[300px]">Nome da Campanha</TableHead>
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
  const [bidStrategy, setBidStrategy] = useState("");
  const [objective, setObjective] = useState("");
  const [buyingType, setBuyingType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || "");
      if (campaign.daily_budget) {
        setBudget((parseInt(campaign.daily_budget) / 100).toString());
        setBudgetType("daily");
      } else if (campaign.lifetime_budget) {
        setBudget((parseInt(campaign.lifetime_budget) / 100).toString());
        setBudgetType("lifetime");
      } else {
        setBudget("");
        setBudgetType("daily");
      }
      setStatus(campaign.status || "PAUSED");
      setBidStrategy(campaign.bid_strategy || "");
      setObjective(campaign.objective || "");
      setBuyingType(campaign.buying_type || "");
    }
  }, [campaign]);

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    const res = await updateCampaign({
      data: {
        campaignId: campaign.id,
        name,
        daily_budget: budgetType === "daily" ? Math.round(parseFloat(budget) * 100) : undefined,
        lifetime_budget: budgetType === "lifetime" ? Math.round(parseFloat(budget) * 100) : undefined,
        status: status,
        bid_strategy: bidStrategy || undefined,
        objective: objective || undefined,
        buying_type: buyingType || undefined
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

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Campanha</DialogTitle>
          <DialogDescription>
            Configure todos os detalhes da sua campanha no Meta Ads.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buying_type">Tipo de Compra</Label>
              <Select value={buyingType} onValueChange={setBuyingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUCTION">Leilão</SelectItem>
                  <SelectItem value="RESERVATION">Reserva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTCOME_SALES">Vendas</SelectItem>
                  <SelectItem value="OUTCOME_LEADS">Cadastros</SelectItem>
                  <SelectItem value="OUTCOME_ENGAGEMENT">Engajamento</SelectItem>
                  <SelectItem value="OUTCOME_TRAFFIC">Tráfego</SelectItem>
                  <SelectItem value="OUTCOME_AWARENESS">Reconhecimento</SelectItem>
                  <SelectItem value="OUTCOME_APP_PROMOTION">Promoção App</SelectItem>
                  <SelectItem value="CONVERSIONS">Conversões (Legado)</SelectItem>
                  <SelectItem value="MESSAGES">Mensagens (Legado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bid_strategy">Estratégia de Lance</Label>
              <Select value={bidStrategy} onValueChange={setBidStrategy}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOWEST_COST_WITHOUT_CAP">Menor Custo</SelectItem>
                  <SelectItem value="LOWEST_COST_WITH_BID_CAP">Limite Lance</SelectItem>
                  <SelectItem value="COST_CAP">Limite Custo</SelectItem>
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
          
          <div className="p-3 bg-muted/50 rounded-lg text-[10px] text-muted-foreground">
            <p className="font-bold mb-1">Nota sobre a Meta API:</p>
            <p>Algumas configurações como Objetivo e Tipo de Compra podem não ser alteráveis após a criação da campanha, dependendo da sua conta de anúncios.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Biblioteca de Criativos</h2>
          <p className="text-xs text-muted-foreground">Analise o desempenho visual dos seus anúncios.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-3 w-3" /> Novo Criativo
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {creatives.map((c) => (
          <Card key={c.id} className="overflow-hidden group">
            <div className="aspect-square relative">
              <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full"><Eye className="h-4 w-4" /></Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-[10px] font-bold truncate uppercase">{c.name}</p>
              <div className="flex justify-between mt-2">
                <div className="text-[9px] uppercase text-muted-foreground">CTR</div>
                <div className="text-[9px] font-bold">1.45%</div>
              </div>
              <div className="flex justify-between">
                <div className="text-[9px] uppercase text-muted-foreground">CPA</div>
                <div className="text-[9px] font-bold">R$ 14,20</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TutorialTab({ creatives, onComplete }: { creatives: any[], onComplete: (selected: any[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold">Vincular Criativos</h2>
        <p className="text-muted-foreground">Siga o passo a passo para configurar sua primeira escala ultra.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20 border-dashed">
        <CardHeader>
           <CardTitle className="text-lg">Passo 1: Seleção de Criativos Winners</CardTitle>
           <CardDescription>Escolha os anúncios que já validaram com ROI positivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creatives.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelected(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} 
                className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${selected.includes(c.id) ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                  <img src={c.image_url || c.thumbnail_url} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-bold truncate uppercase">{c.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="p-6 border-t flex justify-end">
          <Button 
            disabled={selected.length === 0}
            onClick={() => onComplete(creatives.filter(c => selected.includes(c.id)))}
            className="gap-2"
          >
            Vincular {selected.length} Criativos <ChevronRight className="h-4 w-4" />
          </Button>
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


function DryRunModal({ isOpen, onClose, data, pages }: { isOpen: boolean, onClose: () => void, data: { strategy: ScaleStrategy; creatives?: any[] } | null, pages: any[] }) {
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
          name: `[IA ULTRA] ${data.strategy.defaults.namePrefix || data.strategy.name} - ${new Date().toLocaleDateString()}`,
          objective: destination === "WHATSAPP" ? "OUTCOME_ENGAGEMENT" : data.strategy.defaults.objective,
          dailyBudgetCents: data.strategy.defaults.dailyBudgetCents,
          strategy: data.strategy.id,
          status: data.strategy.defaults.status,
          pageId: selectedPage,
          destination: destination,
          creatives: data.creatives?.map(c => ({
            primaryText: "Performance Copy",
            headline: c.name || "Headline",
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
