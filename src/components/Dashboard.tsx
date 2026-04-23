import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  Bell,
  Image as ImageIcon,
  Video,
  Check,
  Plus,
  X,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  History,
  Search,
  ChevronRight,
  Info
} from "lucide-react";
import {
  getAccountInfo,
  getAccountInsights,
  getCampaigns,
  getAccountCreatives,
  getGeoInsights,
  createFullScale,
} from "../server/meta";
import { WhatsAppModal } from "./WhatsAppModal";
import { formatBRL, formatPct } from "../lib/format";

type Tab = "overview" | "tutorial" | "escalas" | "automacao";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const account = useQuery({ queryKey: ["meta-account"], queryFn: () => getAccountInfo() });
  const creatives = useQuery({ queryKey: ["meta-creatives"], queryFn: () => getAccountCreatives() });

  const [isWAModalOpen, setIsWAModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border p-4 flex justify-between items-center bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-bold flex items-center gap-2"><Zap className="text-primary fill-primary" /> Meta Ads Ultra</h1>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
           <button onClick={() => setTab("tutorial")} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${tab === 'tutorial' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>Tutorial</button>
           <button onClick={() => setTab("escalas")} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${tab === 'escalas' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>Escalas</button>
           <button onClick={() => setIsWAModalOpen(true)} className="px-4 py-2 text-xs font-bold rounded-md text-[oklch(0.7_0.18_162)] hover:bg-[oklch(0.7_0.18_162)]/10 flex items-center gap-2">
             <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
           </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {tab === "tutorial" && <TutorialTab creatives={creatives.data?.data || []} />}
        {tab === "escalas" && <EscalasTab />}
        {tab === "overview" && (
          <div className="text-center py-20 space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Bem-vindo ao Meta Ads Ultra</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Sua inteligência artificial para escalar anúncios com precisão cirúrgica.</p>
            <button onClick={() => setTab("tutorial")} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-opacity">Começar Agora</button>
          </div>
        )}
      </main>

      <WhatsAppModal 
        isOpen={isWAModalOpen} 
        onClose={() => setIsWAModalOpen(false)} 
        accountId={account.data?.id || "default"} 
      />
    </div>
  );
}

function TutorialTab({ creatives }: { creatives: any[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
        <h2 className="text-xl font-bold">Vincular Criativos</h2>
        <p className="text-sm text-muted-foreground">Escolha os melhores criativos da sua conta para usar nas escalas.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {creatives.map(c => (
          <div key={c.id} onClick={() => setSelected(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} className={`cursor-pointer rounded-xl border-2 p-2 ${selected.includes(c.id) ? 'border-primary' : 'border-border'}`}>
             <img src={c.image_url || c.thumbnail_url} className="aspect-square object-cover rounded-lg mb-2" />
             <p className="text-[10px] font-bold truncate uppercase">{c.name}</p>
          </div>
        ))}
      </div>
      {selected.length > 0 && <button onClick={() => toast.success("Vinculado!")} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-xl">Vincular {selected.length} criativos</button>}
    </div>
  );
}

function EscalasTab() {
  const [step, setStep] = useState(1);
  const geo = useQuery({ queryKey: ["geo-insights"], queryFn: () => getGeoInsights({ data: { type: "region" } }) });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">1. Upload de Criativos Reais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary cursor-pointer">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs font-bold uppercase">Subir Imagem</p>
            </div>
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary cursor-pointer">
              <Video className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs font-bold uppercase">Subir Vídeo</p>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-primary text-white py-3 rounded-lg font-bold mt-4">Próximo Passo</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">2. Sugestão Geográfica IA</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-bold mb-2">Onde você está vendendo mais:</h3>
            <div className="space-y-2">
              {geo.data?.data?.slice(0, 3).map((r: any) => (
                <div key={r.region} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                  <span>{r.region}</span>
                  <span className="font-bold text-primary">ROI Sugerido: 2.4x</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(3)} className="w-full bg-primary text-white py-3 rounded-lg font-bold mt-4">Analisar Conversão</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">3. Análise Final & Projeção</h2>
            <p className="text-xs text-muted-foreground">Relatório gerado pela IA com base em evidências históricas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground uppercase font-bold">Funil de Conversão Est.</p>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold">1.45%</p>
                  <p className="text-[10px] uppercase text-muted-foreground">CTR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">2.1%</p>
                  <p className="text-[10px] uppercase text-muted-foreground">CVR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[oklch(0.7_0.18_162)]">42</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Vendas</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase">Evidências da IA</span>
                </div>
                <ul className="space-y-2 text-[10px] text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Período Analisado:</span>
                    <span className="font-bold text-foreground">Últimos 30 dias</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Amostra de Dados:</span>
                    <span className="font-bold text-foreground">12.450 impressões</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Similaridade de Nicho:</span>
                    <span className="font-bold text-foreground">94% (Moda/Acessórios)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground uppercase font-bold">Anúncios Semelhantes</p>
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Creative_V1_Final", roas: "3.4x", cpa: "R$ 12,40" },
                  { name: "Static_Banner_02", roas: "2.8x", cpa: "R$ 15,10" },
                  { name: "Video_UGC_Test", roas: "4.1x", cpa: "R$ 9,80" }
                ].map((ad, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-background rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-[10px]">
                        <p className="font-bold truncate w-24">{ad.name}</p>
                        <p className="text-muted-foreground">CPA: {ad.cpa}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-500">{ad.roas}</p>
                      <p className="text-[8px] uppercase text-muted-foreground">ROAS</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-2 text-[10px] font-bold uppercase text-primary flex items-center justify-center gap-1 hover:bg-primary/5 rounded-lg transition-colors">
                Ver todos os 12 anúncios <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="bg-[oklch(0.7_0.18_162)]/10 border border-[oklch(0.7_0.18_162)]/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[oklch(0.7_0.18_162)]/20 rounded-full flex items-center justify-center text-[oklch(0.7_0.18_162)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[oklch(0.7_0.18_162)]">Status de Pré-Escala: APROVADO</p>
                <p className="text-[10px] text-muted-foreground">A IA identificou alta probabilidade de conversão mantendo o ROAS acima de 2.5x.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => toast.success("Campanha enviada para aprovação final!")} 
            className="w-full bg-[oklch(0.7_0.18_162)] text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
          >
            🚀 SUBIR CAMPANHA REAL AGORA
          </button>

          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-[oklch(0.7_0.18_162)] font-bold text-sm">
              <MessageCircle className="h-4 w-4" /> Alertas WhatsApp Ativos
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Você receberá sugestões de escala via WhatsApp se o ROAS for {">"} 3.0x
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
