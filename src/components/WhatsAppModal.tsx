
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  validateWhatsAppNumber, 
  type WhatsAppConfig 
} from "@/lib/whatsapp";
import { MessageCircle, Copy, Check, Info, Trash2, Plus } from "lucide-react";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export function WhatsAppModal({ isOpen, onClose, accountId }: WhatsAppModalProps) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    number: "",
    quickMessages: [""],
    enableUtms: true,
  });

  useEffect(() => {
    if (isOpen && accountId) {
      const saved = getWhatsAppConfig(accountId);
      // Ensure at least one message field exists
      if (saved.quickMessages.length === 0) {
        saved.quickMessages = [""];
      }
      setConfig(saved);
    }
  }, [isOpen, accountId]);

  const handleSave = () => {
    if (!validateWhatsAppNumber(config.number)) {
      toast.error("Número de WhatsApp inválido. Digite apenas números com DDD (ex: 5511999999999)");
      return;
    }

    const filteredMessages = config.quickMessages.filter(m => m.trim() !== "");
    saveWhatsAppConfig(accountId, {
      ...config,
      quickMessages: filteredMessages,
    });
    toast.success("Configurações do WhatsApp salvas!");
    onClose();
  };

  const addMessage = () => {
    if (config.quickMessages.length < 5) {
      setConfig({ ...config, quickMessages: [...config.quickMessages, ""] });
    } else {
      toast.error("Limite máximo de 5 mensagens rápidas atingido");
    }
  };

  const removeMessage = (index: number) => {
    const newMessages = config.quickMessages.filter((_, i) => i !== index);
    if (newMessages.length === 0) newMessages.push("");
    setConfig({ ...config, quickMessages: newMessages });
  };

  const updateMessage = (index: number, value: string) => {
    const newMessages = [...config.quickMessages];
    newMessages[index] = value;
    setConfig({ ...config, quickMessages: newMessages });
  };

  const copyLink = (index: number) => {
    const cleanNum = config.number.replace(/\D/g, "");
    if (!cleanNum) {
      toast.error("Defina o número do WhatsApp antes de copiar o link");
      return;
    }

    let text = config.quickMessages[index] || "";
    const url = new URL(`https://wa.me/${cleanNum}`);
    
    // Add UTMs if enabled (placeholder logic)
    if (config.enableUtms) {
      const utmStr = "[utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}]";
      text = text ? `${text}\n\n${utmStr}` : utmStr;
    }
    
    if (text) url.searchParams.set("text", text);
    
    navigator.clipboard.writeText(url.toString());
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[oklch(0.7_0.18_162)]" />
            Configurar WhatsApp - {accountId}
          </DialogTitle>
          <DialogDescription>
            Configure o número e as mensagens rápidas que serão vinculadas a esta conta de anúncios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="wa-number">Número do WhatsApp (com DDI e DDD)</Label>
            <Input
              id="wa-number"
              placeholder="Ex: 5511999999999"
              value={config.number}
              onChange={(e) => setConfig({ ...config, number: e.target.value })}
              className={!validateWhatsAppNumber(config.number) && config.number ? "border-red-500" : ""}
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Use o formato 55 (Brasil) + DDD + Número
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>UTMs Automáticas</Label>
              <p className="text-[10px] text-muted-foreground">
                Adiciona parâmetros de rastreio ao link gerado.
              </p>
            </div>
            <Switch
              checked={config.enableUtms}
              onCheckedChange={(val) => setConfig({ ...config, enableUtms: val })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mensagens Rápidas (Até 5)</Label>
              <Button variant="outline" size="sm" onClick={addMessage} disabled={config.quickMessages.length >= 5}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.quickMessages.map((msg, idx) => (
                <div key={idx} className="relative group border rounded-md p-3 bg-muted/30">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground mt-1">#{idx + 1}</span>
                    <Textarea
                      placeholder="Script da mensagem..."
                      className="min-h-[60px] text-sm resize-none bg-background"
                      value={msg}
                      onChange={(e) => updateMessage(idx, e.target.value)}
                    />
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeMessage(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => copyLink(idx)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {msg.trim() && (
                    <div className="text-[10px] text-muted-foreground truncate italic">
                      Visualização: wa.me/{config.number.replace(/\D/g, "") || "..."}?text={encodeURIComponent(msg).substring(0, 30)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} className="bg-[oklch(0.7_0.18_162)] hover:opacity-90 text-white flex-1">
            <Check className="h-4 w-4 mr-2" /> Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
