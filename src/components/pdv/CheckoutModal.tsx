import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Banknote, CreditCard, QrCode, Clock, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (method: string) => void;
  onPayLater?: () => void;
  loading?: boolean;
}

const methods = [
  { id: 'PIX', label: 'PIX', icon: QrCode },
  { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'Cartão', label: 'Cartão', icon: CreditCard },
];

const cardTypes = [
  { id: 'Débito', label: 'Débito', icon: Landmark },
  { id: 'Crédito', label: 'Crédito', icon: CreditCard },
];

export default function CheckoutModal({ open, onOpenChange, total, onConfirm, onPayLater, loading }: Props) {
  const [method, setMethod] = useState<string>('PIX');
  const [cardType, setCardType] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState('');

  useEffect(() => {
    setCashReceived('');
    setCardType(null);
  }, [open, method]);

  const cashValue = parseFloat(cashReceived.replace(',', '.')) || 0;
  const change = cashValue - total;
  const isCashShort = method === 'Dinheiro' && cashValue > 0 && change < 0;
  // Cartão exige escolher Débito/Crédito; o método salvo vira "Cartão Débito"/"Cartão Crédito"
  const needsCardType = method === 'Cartão' && !cardType;
  const effectiveMethod = method === 'Cartão' && cardType ? `Cartão ${cardType}` : method;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Fechar comanda</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-5">
          <div className="text-center py-6 rounded-2xl bg-primary/10 border border-primary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total da comanda</p>
            <p className="font-display text-5xl font-bold text-primary">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">O cliente vai pagar agora?</p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                    method === m.id
                      ? 'border-primary bg-primary/15 text-primary scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  <m.icon className="w-6 h-6" />
                  <span className="text-sm font-semibold">{m.label}</span>
                </button>
              ))}
            </div>

            {method === 'Cartão' && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Tipo de cartão</p>
                <div className="grid grid-cols-2 gap-2">
                  {cardTypes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardType(c.id)}
                      className={cn(
                        'flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                        cardType === c.id
                          ? 'border-primary bg-primary/15 text-primary scale-[1.02]'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <c.icon className="w-5 h-5" />
                      <span className="text-sm font-semibold">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === 'Dinheiro' && (
              <div className="mt-4 space-y-3">
                <label className="text-sm font-semibold block">Valor recebido do cliente</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ex: 50,00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className={cn('text-lg font-semibold', isCashShort && 'border-destructive focus-visible:ring-destructive')}
                />
                {cashValue > 0 && (
                  <div className={cn(
                    'text-center py-3 rounded-xl border',
                    change >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  )}>
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
                      {change >= 0 ? 'Troco' : 'Faltando'}
                    </p>
                    <p className="font-display text-3xl font-bold">
                      R$ {Math.abs(change).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {onPayLater && (
              <button
                type="button"
                onClick={onPayLater}
                disabled={loading}
                className="mt-3 w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 transition-all font-semibold"
              >
                <Clock className="w-4 h-4" />
                Cliente vai pagar depois (deixar em aberto)
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(effectiveMethod)}
            disabled={loading || isCashShort || (method === 'Dinheiro' && cashValue <= 0) || needsCardType}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            size="lg"
          >
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
