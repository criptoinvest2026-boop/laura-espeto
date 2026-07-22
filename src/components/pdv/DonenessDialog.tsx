import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DONENESS_OPTIONS } from '@/lib/saleNotes';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName: string;
  onConfirm: (doneness: string | null, obs: string) => void;
  /** Valores iniciais (usado ao EDITAR um item já lançado). */
  initialDoneness?: string | null;
  initialObs?: string;
  /** Rótulo do botão de confirmar (ex: "Salvar" ao editar). */
  confirmLabel?: string;
}

// Pergunta o ponto da carne (e observação opcional) ao adicionar um espeto/carne
// ao carrinho do PDV — ou ao editar um item já lançado. Segue o padrão do CheckoutModal.
export default function DonenessDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
  initialDoneness = null,
  initialObs = '',
  confirmLabel = 'Adicionar',
}: Props) {
  const [doneness, setDoneness] = useState<string | null>(null);
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (open) {
      setDoneness(initialDoneness);
      setObs(initialObs);
    }
  }, [open, initialDoneness, initialObs]);

  const confirm = (chosen: string | null) => {
    onConfirm(chosen, obs);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Ponto da carne
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{productName}</span> — qual o ponto?
          </p>

          <div className="grid grid-cols-3 gap-2">
            {DONENESS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDoneness(option)}
                className={cn(
                  'flex items-center justify-center p-4 rounded-xl border-2 transition-all text-sm font-semibold text-center',
                  doneness === option
                    ? 'border-primary bg-primary/15 text-primary scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Observação (opcional)</label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: sem sal, sem farofa..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => confirm(null)}>
            Sem ponto
          </Button>
          <Button
            onClick={() => confirm(doneness)}
            disabled={!doneness}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            size="lg"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
