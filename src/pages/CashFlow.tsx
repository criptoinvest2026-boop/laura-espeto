import { useMemo, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import { useSales } from '@/hooks/useSales';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CashFlow() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const { sales, deleteSale } = useSales();
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const { categories, createCategory, deleteCategory } = useExpenseCategories();

  const [open, setOpen] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: today,
    notes: '',
  });
  const [newCatName, setNewCatName] = useState('');

  const dayPaidSales = useMemo(
    () => sales.filter((s) => s.sale_date === date && s.payment_status === 'pago'),
    [sales, date]
  );
  const dayExpenses = useMemo(
    () => expenses.filter((e) => e.expense_date === date),
    [expenses, date]
  );

  const totalIn = dayPaidSales.reduce((a, s) => a + Number(s.total_price), 0);
  const totalOut = dayExpenses.reduce((a, e) => a + Number(e.amount), 0);
  const balance = totalIn - totalOut;

  const resetForm = () => setForm({ description: '', amount: '', category: '', expense_date: date, notes: '' });

  const submitExpense = async () => {
    if (!form.description.trim() || !form.amount) {
      toast.error('Preencha descrição e valor');
      return;
    }
    try {
      await createExpense.mutateAsync({
        description: form.description.trim(),
        amount: Number(form.amount),
        category: form.category || null,
        expense_date: form.expense_date,
        notes: form.notes || null,
      });
      setOpen(false);
      resetForm();
    } catch {}
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategory.mutateAsync(newCatName.trim());
    setNewCatName('');
    setNewCatOpen(false);
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Fluxo de Caixa</h1>
                <p className="text-xs text-muted-foreground">Entradas e saídas do dia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                    <Plus className="w-4 h-4 mr-1" /> Novo custo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar custo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Descrição *</Label>
                      <Input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Ex: Compra de carne"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Valor *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={form.expense_date}
                          onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <div className="flex gap-2">
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setNewCatOpen(true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Input
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={submitExpense} disabled={createExpense.isPending}>
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Entradas</p>
                  <p className="font-display text-2xl font-bold">R$ {totalIn.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-rose-500">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-rose-500" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Saídas</p>
                  <p className="font-display text-2xl font-bold">R$ {totalOut.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card className={`p-4 border-l-4 ${balance >= 0 ? 'border-l-primary' : 'border-l-destructive'}`}>
              <div className="flex items-center gap-3">
                <Wallet className={`w-6 h-6 ${balance >= 0 ? 'text-primary' : 'text-destructive'}`} />
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Saldo (Lucro)</p>
                  <p className={`font-display text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    R$ {balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="in">
            <TabsList>
              <TabsTrigger value="in">Entradas ({dayPaidSales.length})</TabsTrigger>
              <TabsTrigger value="out">Saídas ({dayExpenses.length})</TabsTrigger>
              <TabsTrigger value="cats">Categorias de custo</TabsTrigger>
            </TabsList>

            <TabsContent value="in">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cliente/Mesa</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const groups = new Map<string, typeof dayPaidSales>();
                      for (const s of dayPaidSales) {
                        const key = `${s.customer_name}__${format(new Date(s.created_at), 'HH:mm')}__${s.payment_method || ''}`;
                        const arr = groups.get(key) || [];
                        arr.push(s);
                        groups.set(key, arr);
                      }
                      const rows = Array.from(groups.entries());
                      if (rows.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhuma entrada
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return rows.map(([key, items]) => {
                        const first = items[0];
                        const total = items.reduce((a, i) => a + Number(i.total_price), 0);
                        const qty = items.reduce((a, i) => a + Number(i.quantity), 0);
                        const productSummary = items
                          .map((i) => `${i.quantity}x ${i.product_name}`)
                          .join(', ');
                        return (
                          <TableRow key={key}>
                            <TableCell className="text-xs whitespace-nowrap">{format(new Date(first.created_at), 'HH:mm')}</TableCell>
                            <TableCell className="font-medium">{first.customer_name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={productSummary}>
                              {productSummary}
                            </TableCell>
                            <TableCell className="text-center font-semibold">{qty}</TableCell>
                            <TableCell className="text-xs">{first.payment_method || '—'}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">
                              R$ {total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => items.forEach((i) => deleteSale.mutate(i.id))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="out">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma saída
                        </TableCell>
                      </TableRow>
                    ) : (
                      dayExpenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.description}</TableCell>
                          <TableCell>
                            {e.category && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-secondary">{e.category}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.notes || '—'}</TableCell>
                          <TableCell className="text-right font-bold text-rose-600">
                            R$ {Number(e.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteExpense.mutate(e.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="cats">
              <Card className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova categoria"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button onClick={addCategory}>
                    <Plus className="w-4 h-4 mr-1" /> Criar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      {c.name}
                      <button
                        type="button"
                        className="ml-1 text-destructive hover:text-destructive/70"
                        onClick={() => deleteCategory.mutate(c.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nova categoria de custo</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex: Manutenção"
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewCatOpen(false)}>Cancelar</Button>
              <Button onClick={addCategory}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </AppLayout>
  );
}
