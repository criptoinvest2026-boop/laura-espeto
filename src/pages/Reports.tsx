import { useState, useMemo } from 'react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Award, Users, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, AlertCircle, Phone, Copy, Check, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSales } from '@/hooks/useSales';
import { useExpenses } from '@/hooks/useExpenses';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import ConfectioneryDecor from '@/components/decorations/ConfectioneryDecor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PeriodSelector, { Period, periodToInterval } from '@/components/reports/PeriodSelector';
import SalesByTabSection from '@/components/reports/SalesByTabSection';
import { generateReportPdf } from '@/lib/reportPdf';
import { FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type SortDir = 'asc' | 'desc';

function useSortable<T extends string>(defaultDir: SortDir = 'asc') {
  const [field, setField] = useState<T | null>(null);
  const [direction, setDirection] = useState<SortDir>(defaultDir);

  const toggle = (f: T, defaultD: SortDir = 'asc') => {
    if (field === f) {
      setDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setField(f);
      setDirection(defaultD);
    }
  };

  const Icon = ({ f }: { f: string }) => {
    if (field !== f) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
    return direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  return { field, direction, toggle, Icon };
}

export default function Reports() {
  const { sales, updateSale } = useSales();
  const { expenses } = useExpenses();
  const { products } = useProducts();
  const { customers } = useCustomers();

  const getCustomerPhone = (name: string) => {
    const customer = customers.find(c => c.name === name);
    return customer?.phone || null;
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success('Número copiado!');
  };

  const productSort = useSortable<'name' | 'qty' | 'revenue'>();
  const expenseSort = useSortable<'date' | 'description' | 'category' | 'amount'>();
  const customerSort = useSortable<'name' | 'count' | 'total'>();

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Always include the current month
    months.add(format(new Date(), 'yyyy-MM'));
    sales.forEach(sale => months.add(sale.sale_date.substring(0, 7)));
    expenses.forEach(expense => months.add(expense.expense_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [sales, expenses]);

  const [period, setPeriod] = useState<Period>({
    mode: 'month',
    month: availableMonths[0] || format(new Date(), 'yyyy-MM'),
  });

  // Limites do período como strings 'yyyy-MM-dd' (null = sem filtro).
  // Comparação direta de strings, mesmo espírito do startsWith original.
  const interval = useMemo(() => periodToInterval(period), [period]);

  const monthData = useMemo(() => {
    let monthSales, monthExpenses;

    if (!interval) {
      monthSales = sales;
      monthExpenses = expenses;
    } else {
      monthSales = sales.filter(sale => sale.sale_date >= interval.from && sale.sale_date <= interval.to);
      monthExpenses = expenses.filter(
        expense => expense.expense_date >= interval.from && expense.expense_date <= interval.to
      );
    }

    const totalSales = monthSales.reduce((sum, s) => sum + Number(s.total_price), 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = totalSales - totalExpenses;

    const productCounts: Record<string, { count: number; revenue: number; category: string }> = {};
    monthSales.forEach(sale => {
      if (!productCounts[sale.product_name]) {
        const prod = products.find(p => p.name === sale.product_name);
        productCounts[sale.product_name] = { count: 0, revenue: 0, category: prod?.category || 'Sem categoria' };
      }
      productCounts[sale.product_name].count += Number(sale.quantity);
      productCounts[sale.product_name].revenue += Number(sale.total_price);
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const customerTotals: Record<string, { count: number; total: number }> = {};
    monthSales.forEach(sale => {
      if (!customerTotals[sale.customer_name]) customerTotals[sale.customer_name] = { count: 0, total: 0 };
      customerTotals[sale.customer_name].count += 1;
      customerTotals[sale.customer_name].total += Number(sale.total_price);
    });

    const topCustomers = Object.entries(customerTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return { totalSales, totalExpenses, profit, salesCount: monthSales.length, topProducts, topCustomers, monthSales, monthExpenses };
  }, [interval, sales, expenses, products]);

  // Gráfico: granularidade diária quando o período tem até 31 dias; senão mensal.
  const isDailyChart = useMemo(
    () => !!interval && differenceInCalendarDays(parseISO(interval.to), parseISO(interval.from)) <= 31,
    [interval]
  );

  const chartData = useMemo(() => {
    const bucketMap: Record<string, { vendas: number; custos: number }> = {};
    const keyLength = isDailyChart ? 10 : 7; // 'yyyy-MM-dd' ou 'yyyy-MM'
    const inInterval = (date: string) =>
      !isDailyChart || (!!interval && date >= interval.from && date <= interval.to);

    sales.forEach(sale => {
      if (!inInterval(sale.sale_date)) return;
      const key = sale.sale_date.substring(0, keyLength);
      if (!bucketMap[key]) bucketMap[key] = { vendas: 0, custos: 0 };
      bucketMap[key].vendas += Number(sale.total_price);
    });
    expenses.forEach(expense => {
      if (!inInterval(expense.expense_date)) return;
      const key = expense.expense_date.substring(0, keyLength);
      if (!bucketMap[key]) bucketMap[key] = { vendas: 0, custos: 0 };
      bucketMap[key].custos += Number(expense.amount);
    });
    return Object.entries(bucketMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        name: isDailyChart
          ? format(parseISO(key), 'dd/MM', { locale: ptBR })
          : format(new Date(Number(key.split('-')[0]), Number(key.split('-')[1]) - 1), 'MMM/yy', { locale: ptBR }),
        Vendas: Math.round(data.vendas * 100) / 100,
        Custos: Math.round(data.custos * 100) / 100,
        Lucro: Math.round((data.vendas - data.custos) * 100) / 100,
      }));
  }, [sales, expenses, interval, isDailyChart]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!productSort.field) return monthData.topProducts;
    return [...monthData.topProducts].sort((a, b) => {
      const dir = productSort.direction === 'asc' ? 1 : -1;
      switch (productSort.field) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'qty': return dir * (a.count - b.count);
        case 'revenue': return dir * (a.revenue - b.revenue);
        default: return 0;
      }
    });
  }, [monthData.topProducts, productSort.field, productSort.direction]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    const sorted = [...monthData.monthExpenses];
    if (!expenseSort.field) return sorted.sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime());
    return sorted.sort((a, b) => {
      const dir = expenseSort.direction === 'asc' ? 1 : -1;
      switch (expenseSort.field) {
        case 'date': return dir * (new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime());
        case 'description': return dir * a.description.localeCompare(b.description);
        case 'category': return dir * ((a.category || '').localeCompare(b.category || ''));
        case 'amount': return dir * (a.amount - b.amount);
        default: return 0;
      }
    });
  }, [monthData.monthExpenses, expenseSort.field, expenseSort.direction]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    if (!customerSort.field) return monthData.topCustomers;
    return [...monthData.topCustomers].sort((a, b) => {
      const dir = customerSort.direction === 'asc' ? 1 : -1;
      switch (customerSort.field) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'count': return dir * (a.count - b.count);
        case 'total': return dir * (a.total - b.total);
        default: return 0;
      }
    });
  }, [monthData.topCustomers, customerSort.field, customerSort.direction]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof sortedProducts> = {};
    sortedProducts.forEach(p => {
      const cat = p.category || 'Sem categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedProducts]);

  // Group expenses by category
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof sortedExpenses> = {};
    sortedExpenses.forEach(e => {
      const cat = e.category || 'Sem categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedExpenses]);

  // Pending sales grouped by customer, then by month
  const pendingSalesByCustomer = useMemo(() => {
    let pending = sales.filter(s => s.payment_status === 'pendente');
    if (interval) {
      pending = pending.filter(s => s.sale_date >= interval.from && s.sale_date <= interval.to);
    }
    const byCustomer: Record<string, { sales: typeof pending; total: number }> = {};
    pending.forEach(sale => {
      if (!byCustomer[sale.customer_name]) byCustomer[sale.customer_name] = { sales: [], total: 0 };
      byCustomer[sale.customer_name].sales.push(sale);
      byCustomer[sale.customer_name].total += Number(sale.total_price);
    });
    return Object.entries(byCustomer)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [sales, interval]);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return format(new Date(year, month - 1), "MMMM 'de' yyyy", { locale: ptBR });
  };

  const periodLabel =
    period.mode === '7d'
      ? 'Últimos 7 dias'
      : period.mode === 'custom'
      ? period.from && period.to
        ? `${format(period.from, 'dd/MM/yyyy')} a ${format(period.to, 'dd/MM/yyyy')}`
        : 'Período personalizado'
      : period.month === 'all'
      ? 'Todos os meses'
      : formatMonth(period.month);

  const exportPdf = () =>
    generateReportPdf({
      periodLabel,
      totals: monthData,
      sales: monthData.monthSales,
      expenses: monthData.monthExpenses,
      products: monthData.topProducts,
    });

  const PSortIcon = productSort.Icon;
  const ESortIcon = expenseSort.Icon;
  const CSortIcon = customerSort.Icon;

  return (
    <AppLayout>
      <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex items-center gap-3">
            <ConfectioneryDecor variant="reports" />
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground/70 text-xs mt-0.5">Análise de vendas e custos</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <PeriodSelector
              value={period}
              onChange={setPeriod}
              availableMonths={availableMonths}
              formatMonth={formatMonth}
            />
            <Button onClick={exportPdf} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold whitespace-nowrap">
              <FileDown className="w-4 h-4 mr-1" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards - modern grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, staggerChildren: 0.03 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="rounded-2xl bg-card shadow-card p-4 group hover:shadow-soft transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Vendas (Bruto)</p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground font-display leading-none">{formatCurrency(monthData.totalSales)}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">{monthData.salesCount} vendas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-card shadow-card p-4 group hover:shadow-soft transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Custos</p>
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground font-display leading-none">{formatCurrency(monthData.totalExpenses)}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">{monthData.monthExpenses.length} despesas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl bg-card shadow-card p-4 group hover:shadow-soft transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Lucro (Líquido)</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150 ${monthData.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <TrendingUp className={`w-4 h-4 ${monthData.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
            <p className={`text-lg font-bold font-display leading-none ${monthData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(monthData.profit)}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">
              {monthData.totalSales > 0 ? `${((monthData.profit / monthData.totalSales) * 100).toFixed(1)}% margem` : '0%'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card shadow-card p-4 group hover:shadow-soft transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Qtd.</p>
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                <ShoppingCart className="w-4 h-4 text-accent-foreground/70" />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground font-display leading-none">{monthData.salesCount}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">no período</p>
          </motion.div>
        </motion.div>

        {/* Sections */}
        <Accordion type="multiple" className="space-y-3">
          {/* Sales grouped by comanda (mesa + data/hora) */}
          <SalesByTabSection sales={monthData.monthSales} />

          {/* Products Sold */}
          <AccordionItem value="products" className="border-0">
            <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-0">
                <AccordionTrigger className="hover:no-underline py-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Award className="w-4 h-4 text-primary" />
                    Todos os Produtos Vendidos
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-4">
                  {groupedProducts.length > 0 ? (
                    <Accordion type="multiple">
                      {groupedProducts.map(([category, prods]) => {
                        const catTotal = prods.reduce((s, p) => s + p.revenue, 0);
                        const catQty = prods.reduce((s, p) => s + p.count, 0);
                        return (
                          <AccordionItem key={category} value={category} className="border-b last:border-0">
                            <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                              <div className="flex items-center gap-2 flex-1">
                                {category}
                                <Badge variant="secondary" className="text-xs">{prods.length}</Badge>
                                <span className="ml-auto mr-2 text-xs text-muted-foreground">
                                  {catQty} un. • {formatCurrency(catTotal)}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="cursor-pointer select-none" onClick={() => productSort.toggle('name')}>
                                      Produto <PSortIcon f="name" />
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer select-none" onClick={() => productSort.toggle('qty', 'desc')}>
                                      Qtd <PSortIcon f="qty" />
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer select-none" onClick={() => productSort.toggle('revenue', 'desc')}>
                                      Receita <PSortIcon f="revenue" />
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {prods.map((product) => (
                                    <TableRow key={product.name}>
                                      <TableCell className="font-medium">{product.name}</TableCell>
                                      <TableCell className="text-right">{product.count}</TableCell>
                                      <TableCell className="text-right font-semibold">{formatCurrency(product.revenue)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma venda no período</p>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Expenses - grouped by category */}
          <AccordionItem value="expenses" className="border-0">
            <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-0">
                <AccordionTrigger className="hover:no-underline py-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    Custos do Período
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-4">
                  {groupedExpenses.length > 0 ? (
                    <Accordion type="multiple">
                      {groupedExpenses.map(([category, exps]) => {
                        const catTotal = exps.reduce((s, e) => s + e.amount, 0);
                        return (
                          <AccordionItem key={category} value={category} className="border-b last:border-0">
                            <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                              <div className="flex items-center gap-2 flex-1">
                                {category}
                                <Badge variant="secondary" className="text-xs">{exps.length}</Badge>
                                <span className="ml-auto mr-2 text-xs font-semibold text-destructive">
                                  -{formatCurrency(catTotal)}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="cursor-pointer select-none" onClick={() => expenseSort.toggle('date')}>
                                      Data <ESortIcon f="date" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer select-none" onClick={() => expenseSort.toggle('description')}>
                                      Descrição <ESortIcon f="description" />
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer select-none" onClick={() => expenseSort.toggle('amount', 'desc')}>
                                      Valor <ESortIcon f="amount" />
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {exps.map((expense) => (
                                    <TableRow key={expense.id}>
                                      <TableCell>{format(new Date(expense.expense_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                                      <TableCell className="font-medium">{expense.description}</TableCell>
                                      <TableCell className="text-right font-semibold text-destructive">{formatCurrency(expense.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma despesa no período</p>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Customers */}
          <AccordionItem value="customers" className="border-0">
            <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-0">
                <AccordionTrigger className="hover:no-underline py-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Users className="w-4 h-4 text-primary" />
                    Todos os Clientes que Compraram
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-4">
                  {sortedCustomers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => customerSort.toggle('name')}>
                            Cliente <CSortIcon f="name" />
                          </TableHead>
                          <TableHead className="text-right cursor-pointer select-none" onClick={() => customerSort.toggle('count', 'desc')}>
                            Pedidos <CSortIcon f="count" />
                          </TableHead>
                          <TableHead className="text-right cursor-pointer select-none" onClick={() => customerSort.toggle('total', 'desc')}>
                            Total <CSortIcon f="total" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedCustomers.map((customer, index) => (
                          <TableRow key={customer.name}>
                            <TableCell>
                              <Badge variant={index === 0 ? 'default' : 'secondary'} className={index === 0 ? 'bg-primary' : ''}>
                                {index + 1}º
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="text-right">{customer.count}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(customer.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma venda no período</p>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Pending Sales by Customer */}
          <AccordionItem value="pending" className="border-0">
            <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-0">
                <AccordionTrigger className="hover:no-underline py-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    Pedidos Pendentes
                    {pendingSalesByCustomer.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{pendingSalesByCustomer.reduce((s, c) => s + c.sales.length, 0)}</Badge>
                    )}
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-4">
                  {pendingSalesByCustomer.length > 0 ? (
                    <Accordion type="multiple">
                      {pendingSalesByCustomer.map(customer => (
                        <AccordionItem key={customer.name} value={`pending-${customer.name}`} className="border-b last:border-0">
                          <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                            <div className="flex items-center gap-2 flex-1">
                              {customer.name}
                              {(() => {
                                const phone = getCustomerPhone(customer.name);
                                return phone ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); copyPhone(phone); }}
                                    title={`Copiar: ${phone}`}
                                  >
                                    <Phone className="w-3 h-3" />
                                    {phone}
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                ) : null;
                              })()}
                              <Badge variant="secondary" className="text-xs">{customer.sales.length}</Badge>
                              <span className="ml-auto mr-2 text-xs font-semibold text-warning">
                                {formatCurrency(customer.total)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pb-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Produto</TableHead>
                                  <TableHead>Pagamento</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.sales.map(sale => (
                                  <TableRow key={sale.id}>
                                    <TableCell className="text-xs">{format(new Date(sale.sale_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium text-sm">{sale.product_name}</TableCell>
                                    <TableCell className="text-xs">{sale.payment_method || '-'}</TableCell>
                                    <TableCell className="text-right font-semibold text-warning">{formatCurrency(Number(sale.total_price))}</TableCell>
                                    <TableCell className="text-xs">
                                      {sale.payment_due_date ? format(new Date(sale.payment_due_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs text-success hover:text-success hover:bg-success/10"
                                        onClick={() => updateSale.mutateAsync({ id: sale.id, payment_status: 'pago' })}
                                      >
                                        <Check className="w-3 h-3" />
                                        Pago
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum pedido pendente</p>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Monthly Chart */}
          {chartData.length > 1 && (
            <AccordionItem value="chart" className="border-0">
              <Card className="shadow-card border-0 rounded-2xl overflow-hidden">
                <CardHeader className="pb-0">
                  <AccordionTrigger className="hover:no-underline py-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {isDailyChart ? 'Evolução Diária' : 'Evolução Mensal'}
                    </CardTitle>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                        <Tooltip
                          formatter={(value: number) =>
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                          }
                        />
                        <Legend />
                        <Bar dataKey="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Custos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Lucro" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}
        </Accordion>
      </div>
      </PageTransition>
    </AppLayout>
  );
}
