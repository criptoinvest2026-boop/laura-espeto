import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Printer } from 'lucide-react';
import { parseNotes } from '@/lib/saleNotes';

export interface ConfirmItem {
  name: string;
  qty: number;
  price: number;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: string;
  items: ConfirmItem[];
  total: number;
  onConfirm: () => void;
  loading?: boolean;
}

// Conferência do pedido antes de salvar: o atendente revê mesa + itens + ponto,
// evitando lançar errado. Confirmar salva e imprime a via da cozinha.
export default function ConfirmOrderModal({ open, onOpenChange, customer, items, total, onConfirm, loading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Conferir pedido
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 mb-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mesa / Cliente</p>
          <p className="font-display text-lg font-bold">{customer || '—'}</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {items.map((item, i) => {
            const { doneness, obs } = parseNotes(item.notes);
            return (
              <div key={i} className="py-2 flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {item.qty}× {item.name}
                  </p>
                  {(doneness || obs) && (
                    <p className="text-[11px] text-muted-foreground">
                      {doneness && (
                        <span className="inline-block px-1.5 py-px mr-1 rounded bg-primary/10 text-primary font-medium">
                          {doneness}
                        </span>
                      )}
                      {obs}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium shrink-0">R$ {(item.price * item.qty).toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={loading}>
            Voltar
          </Button>
          <Button
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={onConfirm}
            disabled={loading}
          >
            <Printer className="w-4 h-4 mr-1" />
            Salvar e imprimir pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
