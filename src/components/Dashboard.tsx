import { useState } from "react";
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
  Map as MapIcon,
  Bell,
  Activity,
  ZapOff
} from "lucide-react";
import {
  getAccountInfo,
  getAccountCreatives,
  getAccountInsights,
  getCampaigns,
  getConversionFunnel,
  updateCampaignStatus,
  getGeoInsights
} from "../server/meta";
import { WhatsAppModal } from "./WhatsAppModal";
import { SCALE_STRATEGIES } from "../lib/scales";
import { formatBRL, formatNumber, formatPct } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./ui/table";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
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

type View = "overview" | "campaigns" | "scales" | "creatives" | "automation" | "tutorial" | "settings" | "map";

export function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);

  const account = useQuery({ queryKey: ["meta-account"], queryFn: () => getAccountInfo() });
  const insights = useQuery({ queryKey: ["meta-insights"], queryFn: () => getAccountInsights({ data: { datePreset: "last_30d" } }) });
  const campaigns = useQuery({ queryKey: ["meta-campaigns"], queryFn: () => getCampaigns({ data: { datePreset: "last_30d" } }) });
  const creatives = useQuery({ queryKey: ["meta-creatives"], queryFn: () => getAccountCreatives() });
  const funnel = useQuery({ queryKey: ["meta-funnel"], queryFn: () => getConversionFunnel({ data: { datePreset: "last_30d" } }) });

  const accountData = account.data?.ok ? account.data.data : null;
  const campaignsData = campaigns.data?.ok ? campaigns.data.data : [];
  const creativesData = creatives.data?.ok ? creatives.data.data : [];
  const funnelData = funnel.data?.ok ? funnel.data.data : null;
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
                    <SidebarMenuButton isActive={view === "map"} onClick={() => setView("map")}>
                      <MapIcon className="h-4 w-4" />
                      <span>Mapa de Criativos</span>
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
                  {view === "map" && "Mapa de Criativos"}
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
            {view === "scales" && <ScalesTab />}
            {view === "creatives" && <CreativesTab creatives={creativesData} />}
            {view === "automation" && <AutomationPlaceholder />}
            {view === "tutorial" && <TutorialTab creatives={creativesData} />}
            {view === "settings" && <SettingsTab account={accountData} />}
          </main>
        </SidebarInset>

        <WhatsAppModal 
          isOpen={isWAModalOpen} 
          onClose={() => setIsWAModalOpen(false)} 
          accountId={accountData ? accountData.id : "default"} 
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
              <TableHead>Investido</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>CPA</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead className="text-right">Ação</TableHead>
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
                <TableCell>
                  <div className="font-medium truncate max-w-[280px]">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{c.objective}</div>
                </TableCell>
                <TableCell>{formatBRL(c.spend)}</TableCell>
                <TableCell className={`font-bold ${c.roas >= 2.5 ? 'text-[oklch(0.7_0.18_162)]' : 'text-blue-500'}`}>
                  {c.roas.toFixed(2)}x
                </TableCell>
                <TableCell>{formatBRL(c.cpa)}</TableCell>
                <TableCell>{formatPct(c.ctr)}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => toast.info(`Relatório completo de ${c.name} em breve.`)}>
                     <BarChart3 className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ScalesTab() {
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
               <Button className="w-full text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="outline" onClick={() => toast.success(`Iniciando escala ${s.name}...`)}>
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

function TutorialTab({ creatives }: { creatives: any[] }) {
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
            onClick={() => toast.success("Criativos vinculados com sucesso!")}
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

function AutomationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
        <RefreshCw className="h-10 w-10 text-primary animate-spin-slow" />
      </div>
      <h2 className="text-2xl font-bold">Regras de Automação IA</h2>
      <p className="text-muted-foreground max-w-md">O motor de automação está analisando seus dados históricos para sugerir as melhores regras de otimização.</p>
      <Button disabled className="mt-4">Sugerir Regras (Beta)</Button>
    </div>
  );
}
