import { useMemo } from 'react';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { Sale } from '@/types/database';
import { parseNotes } from '@/lib/saleNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface TabGroup {
  key: string;
  name: string;
  openedAt: string; // menor created_at do grupo
  items: Sale[];
  total: number;
  allPaid: boolean;
}

// Vendas do período agrupadas por comanda (mesa + dia): data/hora + mesa no
// cabeçalho, itens (produto, ponto, quantidade, valor) no gaveteiro.
// Limitação conhecida: a mesma mesa duas vezes no mesmo dia aparece mesclada.
export default function SalesByTabSection({ sales }: { sales: Sale[] }) {
  const groups = useMemo<TabGroup[]>(() => {
    const map = new Map<string, TabGroup>();
    for (const sale of sales) {
      const key = `${sale.customer_name}|${sale.sale_date}`;
      let group = map.get(key);
      if (!group) {
        group = { key, name: sale.customer_name, openedAt: sale.created_at, items: [], total: 0, allPaid: true };
        map.set(key, group);
      }
      group.items.push(sale);
      group.total += Number(sale.total_price);
      if (sale.created_at < group.openedAt) group.openedAt = sale.created_at;
      if (sale.payment_status !== 'pago') group.allPaid = false;
    }
    return Array.from(map.values()).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }, [sales]);

  return (
    <AccordionItem value="by-tab" className="border-0">
      <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0">
          <AccordionTrigger className="hover:no-underline py-0">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <ClipboardList className="w-4 h-4 text-primary" />
              Vendas por Comanda
              {groups.length > 0 && (
                <Badge variant="secondary" className="text-xs">{groups.length}</Badge>
              )}
            </CardTitle>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent>
          <CardContent className="pt-4">
            {groups.length > 0 ? (
              <Accordion type="multiple">
                {groups.map((group) => (
                  <AccordionItem key={group.key} value={group.key} className="border-b last:border-0">
                    <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground font-normal shrink-0">
                          {format(new Date(group.openedAt), 'dd/MM HH:mm')}
                        </span>
                        <span className="truncate">{group.name}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase ${
                            group.allPaid ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                          }`}
                        >
                          {group.allPaid ? 'Pago' : 'Pendente'}
                        </Badge>
                        <span className="ml-auto mr-2 text-xs font-semibold text-primary shrink-0">
                          {formatCurrency(group.total)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Ponto / Obs.</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((sale) => {
                            const { doneness, obs } = parseNotes(sale.notes);
                            return (
                              <TableRow key={sale.id}>
                                <TableCell className="font-medium text-sm">{sale.product_name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {doneness && (
                                    <span className="inline-block px-1.5 py-px mr-1 rounded bg-primary/10 text-primary font-medium">
                                      {doneness}
                                    </span>
                                  )}
                                  {obs || (!doneness && '-')}
                                </TableCell>
                                <TableCell className="text-right">{Number(sale.quantity)}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(Number(sale.total_price))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma venda no período</p>
            )}
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
