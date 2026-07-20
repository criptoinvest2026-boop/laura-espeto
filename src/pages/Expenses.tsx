import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import ConfectioneryDecor from '@/components/decorations/ConfectioneryDecor';
import ExpenseCategoryManager from '@/components/expenses/ExpenseCategoryManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Receipt, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ALL_MONTHS = 'all';

export default function Expenses() {
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { categories: expenseCategories } = useExpenseCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  const [sortField, setSortField] = useState<'description' | 'category' | 'amount' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(format(new Date(), 'yyyy-MM'));
    expenses.forEach(e => months.add(e.expense_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return format(new Date(year, month - 1), "MMMM 'de' yyyy", { locale: ptBR });
  };

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense: any) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || '',
      expense_date: expense.expense_date,
      notes: expense.notes || '',
    });
    setEditingExpense(expense.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category || null,
      expense_date: formData.expense_date,
      notes: formData.notes || null,
    };

    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense, ...expenseData });
    } else {
      await createExpense.mutateAsync(expenseData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'amount' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesMonth = selectedMonth === ALL_MONTHS || expense.expense_date.startsWith(selectedMonth);
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.category && expense.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMonth && matchesSearch;
  });

  const sortedExpenses = useMemo(() => {
    if (!sortField) return filteredExpenses;
    return [...filteredExpenses].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'description': return dir * a.description.localeCompare(b.description);
        case 'category': return dir * ((a.category || '').localeCompare(b.category || ''));
        case 'amount': return dir * (a.amount - b.amount);
        case 'date': return dir * (new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime());
        default: return 0;
      }
    });
  }, [filteredExpenses, sortField, sortDirection]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <ConfectioneryDecor variant="expenses" />
            <h1 className="font-display text-3xl font-bold text-foreground">Custos</h1>
            <p className="text-muted-foreground mt-1 capitalize">
              {selectedMonth === ALL_MONTHS ? 'Todos os meses' : formatMonth(selectedMonth)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MONTHS}>Todos os meses</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month} className="capitalize">{formatMonth(month)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingExpense ? 'Editar Custo' : 'Novo Custo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Farinha de trigo"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Data *</Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    {editingExpense ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList>
            <TabsTrigger value="expenses">Custos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-4">
            {/* Search */}
            <Card className="shadow-card border-0">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar custos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Expenses grouped by category */}
            <Card className="shadow-card border-0">
              <CardContent className="p-2">
                {(() => {
                  const grouped: Record<string, typeof sortedExpenses> = {};
                  sortedExpenses.forEach(exp => {
                    const cat = exp.category || 'Sem categoria';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(exp);
                  });
                  const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

                  if (entries.length === 0) {
                    return (
                      <div className="flex flex-col items-center text-muted-foreground py-8">
                        <Receipt className="w-12 h-12 mb-2 opacity-50" />
                        <p>Nenhum custo encontrado</p>
                      </div>
                    );
                  }

                  return (
                    <Accordion type="multiple">
                      {entries.map(([category, exps]) => {
                        const categoryTotal = exps.reduce((sum, e) => sum + e.amount, 0);
                        return (
                          <AccordionItem key={category} value={category} className="border-b last:border-0">
                            <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                              <div className="flex items-center gap-2 flex-1">
                                {category}
                                <Badge variant="secondary" className="text-xs">{exps.length}</Badge>
                                <span className="ml-auto mr-2 text-xs font-semibold text-destructive">
                                  -{formatCurrency(categoryTotal)}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('description')}>
                                      Descrição <SortIcon field="description" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('amount')}>
                                      Valor <SortIcon field="amount" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                                      Data <SortIcon field="date" />
                                    </TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {exps.map((expense) => (
                                    <TableRow key={expense.id}>
                                      <TableCell className="font-medium">{expense.description}</TableCell>
                                      <TableCell className="font-semibold text-destructive">
                                        -{formatCurrency(expense.amount)}
                                      </TableCell>
                                      <TableCell>
                                        {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: ptBR })}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                                            <Pencil className="w-4 h-4" />
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja excluir o custo "{expense.description}"?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => deleteExpense.mutate(expense.id)}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                  Excluir
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <ExpenseCategoryManager />
          </TabsContent>
        </Tabs>
      </div>
      </PageTransition>
    </AppLayout>
  );
}
