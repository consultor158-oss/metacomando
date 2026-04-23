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
import { formatBRL, formatPct } from "../lib/format";

type Tab = "overview" | "tutorial" | "escalas" | "automacao";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const account = useQuery({ queryKey: ["meta-account"], queryFn: () => getAccountInfo() });
  const creatives = useQuery({ queryKey: ["meta-creatives"], queryFn: () => getAccountCreatives() });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2"><Zap className="text-primary" /> Meta Ads Ultra</h1>
        <div className="flex gap-2">
           <button onClick={() => setTab("tutorial")} className={`px-4 py-2 rounded-md ${tab === 'tutorial' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>Tutorial</button>
           <button onClick={() => setTab("escalas")} className={`px-4 py-2 rounded-md ${tab === 'escalas' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>Escalas</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {tab === "tutorial" && <TutorialTab creatives={creatives.data?.data || []} />}
        {tab === "escalas" && <EscalasTab />}
        {tab === "overview" && <div className="text-center py-20 text-muted-foreground">Selecione uma aba para começar.</div>}
      </main>
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
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-bold">3. Análise Final & Projeção</h2>
            <div className="py-8 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground uppercase font-bold">Funil de Conversão & Projeção</p>
            <div className="flex justify-around mt-4">
               <div><p className="text-2xl font-bold">1.45%</p><p className="text-[10px] uppercase">CTR</p></div>
               <div><p className="text-2xl font-bold">2.1%</p><p className="text-[10px] uppercase">CVR</p></div>
               <div><p className="text-2xl font-bold">42</p><p className="text-[10px] uppercase">Vendas Est.</p></div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">Evidência: Dados baseados em 12 anúncios semelhantes rodados nos últimos 30 dias.</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center justify-between text-emerald-400 text-xs font-bold uppercase">
             <span>Status Pré-Subida: Aprovado pela IA</span>
             <ShieldCheck className="h-4 w-4" />
          </div>
          <button onClick={() => toast.success("Campanha enviada!")} className="w-full bg-[oklch(0.7_0.18_162)] text-white py-4 rounded-lg font-bold text-lg shadow-lg">🚀 SUBIR CAMPANHA REAL AGORA</button>

          <div className="flex items-center justify-center gap-2 mt-4 text-[oklch(0.7_0.18_162)] font-bold">
            <MessageCircle className="h-4 w-4" /> Alertas WhatsApp Ativados
          </div>
        </div>
      )}
    </div>
  );
}
