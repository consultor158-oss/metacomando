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
                    <p className="text-[11px] text-slate-400">A estratégia <strong>{selectedStrategy.name}</strong> será aplicada automaticamente em nível de Campanha (CBO) para maximizar o ROAS.</p>
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
                         <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Recomendação IA para Escala</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Para escala global, use <strong>Público Aberto (Broad)</strong> ou <strong>Lookalike 1%</strong>. 
                        O algoritmo da Meta encontra os melhores compradores automaticamente quando o criativo é forte. 
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-1">
                         <Users className="h-3 w-3 text-orange-500" />
                         <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Escala de Público</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Ao escalar, teste <strong>Lookalike de Compradores (LAL)</strong> e <strong>Públicos de Retenção</strong>. 
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
                     {city ? ` ${city}` : ""}
                     {interests ? ` + ${interests.split(',').length} Interesses` : " + Público Aberto"}
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