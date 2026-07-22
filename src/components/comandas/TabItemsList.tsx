import { Sale } from '@/types/database';
import { parseNotes } from '@/lib/saleNotes';

// Lista de itens de uma comanda: quantidade × produto + ponto da carne/observação + valor.
// Reutilizada em Comandas, Dashboard e Relatórios.
export default function TabItemsList({ items }: { items: Sale[] }) {
  return (
    <div className="space-y-1 text-sm">
      {items.map((item) => {
        const { doneness, obs } = parseNotes(item.notes);
        return (
          <div key={item.id} className="flex justify-between gap-2 text-foreground/80">
            <div className="min-w-0">
              <span className="truncate block">
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
            <span className="font-medium text-foreground shrink-0">
              R$ {Number(item.total_price).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
