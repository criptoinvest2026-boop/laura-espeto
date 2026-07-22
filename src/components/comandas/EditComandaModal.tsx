import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Flame, Pencil } from 'lucide-react';
import { OpenTab } from '@/hooks/useOpenTabs';
import { Sale } from '@/types/database';
import { useSales } from '@/hooks/useSales';
import { parseNotes, formatNotes, productNeedsDoneness } from '@/lib/saleNotes';
import DonenessDialog from '@/components/pdv/DonenessDialog';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tab: OpenTab | null;
  /** categoria por nome de produto, para saber se o item pede ponto */
  categoryOf?: (productName: string) => string | null;
}

// Edita um pedido JÁ LANÇADO (comanda aberta / pendente): muda quantidade,
// ponto da carne / observação, remove item ou adiciona mais. Cada item é uma
// linha em `sales`, então tudo usa updateSale/deleteSale e atualiza em tempo real.
export default function EditComandaModal({ open, onOpenChange, tab, categoryOf }: Props) {
  const { updateSale, deleteSale } = useSales();
  const navigate = useNavigate();
  const [editingPonto, setEditingPonto] = useState<Sale | null>(null);

  // Se a comanda esvaziou (todos os itens removidos), ela some da lista → fecha.
  useEffect(() => {
    if (open && !tab) onOpenChange(false);
  }, [open, tab, onOpenChange]);

  if (!tab) return null;

  const setQty = (item: Sale, qty: number) => {
    if (qty < 1) return;
    const unit = Number(item.unit_price);
    updateSale.mutateAsync({ id: item.id, quantity: qty, total_price: unit * qty });
  };

  const removeItem = (item: Sale) => {
    deleteSale.mutateAsync(item.id);
    toast.success('Item removido do pedido');
  };

  const saverPonto = (doneness: string | null, obs: string) => {
    if (!editingPonto) return;
    updateSale.mutateAsync({ id: editingPonto.id, notes: formatNotes(doneness, obs) });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar pedido — {tab.name}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-2 px-2 divide-y divide-border/60">
            {tab.items.map((item) => {
              const { doneness, obs } = parseNotes(item.notes);
              const qty = Number(item.quantity);
              const canHavePonto =
                productNeedsDoneness(categoryOf?.(item.product_name) ?? null) || !!doneness;
              return (
                <div key={item.id} className="py-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.product_name}</p>
                    {(doneness || obs) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {doneness && (
                          <span className="inline-block px-1.5 py-px mr-1 rounded bg-primary/10 text-primary font-medium">
                            {doneness}
                          </span>
                        )}
                        {obs}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        R$ {Number(item.unit_price).toFixed(2)} un.
                      </span>
                      {canHavePonto && (
                        <button
                          type="button"
                          onClick={() => setEditingPonto(item)}
                          className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <Flame className="w-3 h-3" />
                          {doneness ? 'Trocar ponto' : 'Definir ponto'}
                        </button>
                      )}
                      {!canHavePonto && (
                        <button
                          type="button"
                          onClick={() => setEditingPonto(item)}
                          className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <Pencil className="w-3 h-3" />
                          Observação
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(item, qty - 1)} disabled={qty <= 1}>
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-6 text-center font-bold text-sm">{qty}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(item, qty + 1)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                onOpenChange(false);
                navigate(`/pdv?comanda=${encodeURIComponent(tab.name)}`);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar item
            </Button>
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => onOpenChange(false)}>
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DonenessDialog
        open={!!editingPonto}
        onOpenChange={(v) => !v && setEditingPonto(null)}
        productName={editingPonto?.product_name || ''}
        initialDoneness={editingPonto ? parseNotes(editingPonto.notes).doneness : null}
        initialObs={editingPonto ? parseNotes(editingPonto.notes).obs || '' : ''}
        confirmLabel="Salvar"
        onConfirm={saverPonto}
      />
    </>
  );
}
