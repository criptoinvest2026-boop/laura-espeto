import { Sale } from '@/types/database';
import { parseNotes } from '@/lib/saleNotes';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  items: Sale[];
  /** Quando fornecido, mostra o toggle de "entregue" por item (só na tela Comandas). */
  onToggleDelivered?: (item: Sale) => void;
}

// Lista de itens de uma comanda: quantidade × produto + ponto da carne/observação + valor.
// Reutilizada em Comandas, Dashboard e Relatórios. Com onToggleDelivered, permite
// marcar cada item como entregue ao cliente (evita esquecer / entregar 2x).
export default function TabItemsList({ items, onToggleDelivered }: Props) {
  return (
    <div className="space-y-1 text-sm">
      {items.map((item) => {
        const { doneness, obs } = parseNotes(item.notes);
        const delivered = !!item.delivered;
        return (
          <div key={item.id} className="flex justify-between gap-2 text-foreground/80">
            <div className="flex items-start gap-2 min-w-0">
              {onToggleDelivered && (
                <button
                  type="button"
                  onClick={() => onToggleDelivered(item)}
                  title={delivered ? 'Marcar como não entregue' : 'Marcar como entregue'}
                  className={`mt-0.5 shrink-0 ${delivered ? 'text-emerald-600' : 'text-muted-foreground/50 hover:text-emerald-600'}`}
                >
                  {delivered ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
              )}
              <div className="min-w-0">
                <span className={`truncate block ${delivered ? 'line-through text-muted-foreground' : ''}`}>
                  {item.quantity}× {item.product_name}
                </span>
                {(doneness || obs) && (
                  <span className="block text-[11px] text-muted-foreground">
                    {doneness && (
                      <span className="inline-block px-1.5 py-px mr-1 rounded bg-primary/10 text-primary font-medium">
                        {doneness}
                      </span>
                    )}
                    {obs}
                  </span>
                )}
              </div>
            </div>
            <span className="font-medium text-foreground shrink-0">
              R$ {Number(item.total_price).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
