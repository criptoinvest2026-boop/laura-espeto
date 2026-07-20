import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Check, X, PlusCircle, ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, ShoppingCart } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import PageTransition from '@/components/layout/PageTransition';
import ConfectioneryDecor from '@/components/decorations/ConfectioneryDecor';
import { motion } from 'framer-motion';
import { getProductEmoji } from '@/lib/productEmojis';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csv';

const paymentMethods = ['PIX', 'Dinheiro', 'Cartão', 'Transferência'];
const sellers = ['Vitor', 'Isabela'];

interface SaleItem {
  product_name: string;
  quantity: string;
  unit_price: string;
}

interface PaymentSplit {
  method: string;
  amount: string;
}

export default function Sales() {
  const { sales, createSale, updateSale, deleteSale } = useSales();
  const { products, createProduct } = useProducts();
  const { customers, createCustomer, updateCustomer } = useCustomers();

  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'product' | 'customer' | 'seller' | 'qty' | 'total' | 'status' | 'due' | 'payment' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Multi-item form
  const [items, setItems] = useState<SaleItem[]>([{ product_name: '', quantity: '1', unit_price: '' }]);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([{ method: '', amount: '' }]);
  const [customerPhones, setCustomerPhones] = useState<string[]>(['']);
  const [tableNumber, setTableNumber] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    payment_status: 'pago' as 'pago' | 'pendente',
    payment_method: '',
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    payment_due_date: '',
    seller_name: 'Vitor',
    notes: '',
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [editPaymentSplits, setEditPaymentSplits] = useState<PaymentSplit[]>([{ method: '', amount: '' }]);
  const [editCustomerPhones, setEditCustomerPhones] = useState<string[]>(['']);
  const [editFormData, setEditFormData] = useState({
    product_name: '',
    customer_name: '',
    quantity: '1',
    unit_price: '',
    payment_status: 'pendente' as 'pago' | 'pendente',
    payment_method: '',
    sale_date: '',
    payment_due_date: '',
    seller_name: 'Vitor',
    notes: '',
  });

  const resetForm = () => {
    setItems([{ product_name: '', quantity: '1', unit_price: '' }]);
    setPaymentSplits([{ method: '', amount: '' }]);
    setCustomerPhones(['']);
    setTableNumber('');
    setFormData({
      customer_name: '',
      payment_status: 'pago',
      payment_method: '',
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      payment_due_date: '',
      seller_name: 'Vitor',
      notes: '',
    });
  };

  const buildPaymentMethodString = (splits: PaymentSplit[]) => {
    const validSplits = splits.filter(s => s.method);
    if (validSplits.length === 0) return '';
    if (validSplits.length === 1) return validSplits[0].method;
    return validSplits.map(s => s.amount ? `${s.method} (R$${s.amount})` : s.method).join(' + ');
  };

  const parsePaymentMethodString = (method: string | null): PaymentSplit[] => {
    if (!method) return [{ method: '', amount: '' }];
    if (!method.includes('+')) return [{ method, amount: '' }];
    return method.split('+').map(part => {
      const match = part.trim().match(/^(.+?)\s*\(R\$(.+?)\)$/);
      if (match) return { method: match[1].trim(), amount: match[2].trim() };
      return { method: part.trim(), amount: '' };
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_name: '', quantity: '1', unit_price: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === 'product_name') {
        const product = products.find(p => p.name === value);
        return { ...item, product_name: value, unit_price: product ? product.price.toString() : item.unit_price };
      }
      return { ...item, [field]: value };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.product_name && item.unit_price);
    if (validItems.length === 0 || !tableNumber.trim()) {
      toast.error('Informe a mesa e pelo menos um produto');
      return;
    }

    const customerName = `Mesa ${tableNumber.trim()}`;

    // Check/create customer (table)
    const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    let customerId = existingCustomer?.id;
    if (!existingCustomer) {
      const result = await createCustomer.mutateAsync({ name: customerName, phone: null, email: null, notes: null });
      customerId = result?.id;
    }

    // Create one sale per item
    for (const item of validItems) {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const totalPrice = quantity * unitPrice;

      const existingProduct = products.find(p => p.name.toLowerCase() === item.product_name.toLowerCase());
      let productId = existingProduct?.id;
      if (!existingProduct) {
        const result = await createProduct.mutateAsync({ name: item.product_name, price: unitPrice, unit: 'unidade', category: null, is_active: true });
        productId = result?.id;
      }

      const paymentMethodStr = buildPaymentMethodString(paymentSplits);

      await createSale.mutateAsync({
        product_id: productId || null,
        customer_id: customerId || null,
        product_name: item.product_name,
        customer_name: customerName,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        payment_status: formData.payment_status,
        payment_method: paymentMethodStr || null,
        sale_date: formData.sale_date,
        payment_due_date: formData.payment_due_date || null,
        seller_name: formData.seller_name,
        notes: formData.notes || null,
        created_by: null,
      });
    }

    toast.success(`${validItems.length} ${validItems.length === 1 ? 'venda registrada' : 'vendas registradas'} com sucesso!`);
    resetForm();
    setOpen(false);
  };

  const togglePaymentStatus = async (saleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
    await updateSale.mutateAsync({ id: saleId, payment_status: newStatus });
  };

  const openEditDialog = (sale: typeof sales[0]) => {
    setEditingSale(sale.id);
    setEditPaymentSplits(parsePaymentMethodString(sale.payment_method));
    const customerMatch = customers.find(c => c.name === sale.customer_name);
    setEditCustomerPhones(customerMatch?.phone ? customerMatch.phone.split(',').map(p => p.trim()) : ['']);
    setEditFormData({
      product_name: sale.product_name,
      customer_name: sale.customer_name,
      quantity: sale.quantity.toString(),
      unit_price: sale.unit_price.toString(),
      payment_status: sale.payment_status as 'pago' | 'pendente',
      payment_method: sale.payment_method || '',
      sale_date: sale.sale_date,
      payment_due_date: sale.payment_due_date || '',
      seller_name: sale.seller_name || 'Vitor',
      notes: sale.notes || '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !editFormData.product_name || !editFormData.customer_name || !editFormData.unit_price) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const quantity = parseFloat(editFormData.quantity) || 1;
    const unitPrice = parseFloat(editFormData.unit_price) || 0;
    const totalPrice = quantity * unitPrice;
    await updateSale.mutateAsync({
      id: editingSale,
      product_name: editFormData.product_name,
      customer_name: editFormData.customer_name,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      payment_status: editFormData.payment_status,
      payment_method: buildPaymentMethodString(editPaymentSplits) || null,
      sale_date: editFormData.sale_date,
      payment_due_date: editFormData.payment_due_date || null,
      seller_name: editFormData.seller_name,
      notes: editFormData.notes || null,
    });
    // Update customer phone if changed
    const editPhoneStr = editCustomerPhones.filter(p => p.trim()).join(', ') || null;
    if (editPhoneStr) {
      const existingCustomer = customers.find(c => c.name.toLowerCase() === editFormData.customer_name.toLowerCase());
      if (existingCustomer && editPhoneStr !== existingCustomer.phone) {
        await updateCustomer.mutateAsync({ id: existingCustomer.id, phone: editPhoneStr });
      }
    }
    setEditOpen(false);
    setEditingSale(null);
  };

  const editTotalPrice = parseFloat(editFormData.quantity || '1') * parseFloat(editFormData.unit_price || '0');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Available months from sales data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(format(new Date(), 'yyyy-MM'));
    sales.forEach(sale => months.add(sale.sale_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [sales]);

  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return format(new Date(year, month - 1), "MMMM 'de' yyyy", { locale: ptBR });
  };

  // Get unique categories from products linked to sales
  const saleCategories = useMemo(() => {
    const cats = new Set<string>();
    sales.forEach(sale => {
      const product = products.find(p => p.name === sale.product_name);
      if (product?.category) cats.add(product.category);
    });
    return Array.from(cats).sort();
  }, [sales, products]);

  const filteredSales = sales.filter(sale => {
    const matchesMonth = sale.sale_date.startsWith(selectedMonth);
    const matchesSearch = sale.product_name.toLowerCase().includes(search.toLowerCase()) || sale.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.payment_status === statusFilter;
    const matchesSeller = sellerFilter === 'all' || sale.seller_name === sellerFilter;
    const matchesPayment = paymentMethodFilter === 'all' || sale.payment_method === paymentMethodFilter;
    const matchesCategory = categoryFilter === 'all' || (() => {
      const product = products.find(p => p.name === sale.product_name);
      return product?.category === categoryFilter;
    })();
    return matchesMonth && matchesSearch && matchesStatus && matchesSeller && matchesPayment && matchesCategory;
  });
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'total' || field === 'qty' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const sortedSales = useMemo(() => {
    if (!sortField) return filteredSales;
    return [...filteredSales].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'date': return dir * (new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());
        case 'product': return dir * a.product_name.localeCompare(b.product_name);
        case 'customer': return dir * a.customer_name.localeCompare(b.customer_name);
        case 'seller': return dir * ((a.seller_name || '').localeCompare(b.seller_name || ''));
        case 'qty': return dir * (Number(a.quantity) - Number(b.quantity));
        case 'total': return dir * (Number(a.total_price) - Number(b.total_price));
        case 'status': return dir * a.payment_status.localeCompare(b.payment_status);
        case 'due': {
          const aDate = a.payment_due_date ? new Date(a.payment_due_date).getTime() : 0;
          const bDate = b.payment_due_date ? new Date(b.payment_due_date).getTime() : 0;
          return dir * (aDate - bDate);
        }
        case 'payment': return dir * ((a.payment_method || '').localeCompare(b.payment_method || ''));
        default: return 0;
      }
    });
  }, [filteredSales, sortField, sortDirection]);

  const grandTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0);
  }, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <AppLayout>
      <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <ConfectioneryDecor variant="sales" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Vendas</h1>
                <p className="text-muted-foreground/70 text-xs capitalize mt-0.5">{formatMonth(selectedMonth)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month} className="capitalize">{formatMonth(month)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Registrar Venda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mesa */}
                <div className="space-y-2">
                  <Label>Mesa *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Nº da mesa"
                    autoFocus
                    required
                  />
                </div>

                {/* Items / Sabores */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Sabores / Produtos</Label>
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                      <PlusCircle className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Sabor / Produto</Label>
                        {item.product_name ? (
                          <div className="flex items-center gap-2 p-2 rounded-md border border-accent/30 bg-secondary/50">
                            <span className="font-medium flex-1">{item.product_name}</span>
                            <span className="text-xs text-muted-foreground">{item.unit_price ? formatCurrency(parseFloat(item.unit_price)) : ''}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItem(index, 'product_name', '')}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible className="border rounded-md border-accent/30 bg-secondary/50">
                            {(() => {
                              const grouped: Record<string, typeof products> = {};
                              products.forEach(p => {
                                const cat = (p.category || '').trim() || 'Sem categoria';
                                if (!grouped[cat]) grouped[cat] = [];
                                grouped[cat].push(p);
                              });
                              return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, prods]) => (
                                <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                                  <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline">
                                    {category}
                                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">{prods.length}</Badge>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-1 pb-1">
                                    <div className="space-y-0.5">
                                      {prods.map(p => (
                                        <button
                                          key={p.id}
                                          type="button"
                                          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent/20 transition-colors text-left"
                                          onClick={() => updateItem(index, 'product_name', p.name)}
                                        >
                                          <span className="font-medium">{p.name}</span>
                                          <span className="text-xs text-muted-foreground">{formatCurrency(p.price)}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ));
                            })()}
                          </Accordion>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Qtd</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Preço Un.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        Subtotal: <span className="font-semibold text-foreground">{formatCurrency((parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total ({items.length} {items.length === 1 ? 'item' : 'itens'}):</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.payment_status} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_status: v as 'pago' | 'pendente' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Forma de Pagamento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                      onClick={() => setPaymentSplits(prev => [...prev, { method: '', amount: '' }])}
                      title="Dividir pagamento"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  {paymentSplits.map((split, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={split.method} onValueChange={(v) => setPaymentSplits(prev => prev.map((s, i) => i === idx ? { ...s, method: v } : s))}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {paymentSplits.length > 1 && (
                        <>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="R$ valor"
                            value={split.amount}
                            onChange={(e) => setPaymentSplits(prev => prev.map((s, i) => i === idx ? { ...s, amount: e.target.value } : s))}
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive shrink-0"
                            onClick={() => setPaymentSplits(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Vendedor(a)</Label>
                  <Select value={formData.seller_name} onValueChange={(v) => setFormData(prev => ({ ...prev, seller_name: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {sellers.map(seller => (
                        <SelectItem key={seller} value={seller}>{seller}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Venda</Label>
                    <Input type="date" value={formData.sale_date} onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))} />
                  </div>
                  {formData.payment_status === 'pendente' && (
                    <div className="space-y-2">
                      <Label>Vencimento</Label>
                      <Input
                        type="date"
                        value={formData.payment_due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_due_date: e.target.value }))}
                        min={formData.sale_date}
                        className="border-warning/30 focus:ring-warning/30"
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={createSale.isPending}>
                  {createSale.isPending ? 'Salvando...' : `Registrar ${items.length > 1 ? items.length + ' Vendas' : 'Venda'}`}
                </Button>
              </form>
            </DialogContent>
           </Dialog>
          </div>
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Card className="shadow-card border-0 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por produto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" size="default" className="gap-2 shrink-0" onClick={() => setShowFilters(prev => !prev)}>
                <Filter className="w-4 h-4" />
                Filtros
                {(statusFilter !== 'all' || categoryFilter !== 'all' || sellerFilter !== 'all' || paymentMethodFilter !== 'all') && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {[statusFilter, categoryFilter, sellerFilter, paymentMethodFilter].filter(f => f !== 'all').length}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {saleCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sellerFilter} onValueChange={setSellerFilter}>
                    <SelectTrigger><SelectValue placeholder="Vendedor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Vendedores</SelectItem>
                      {sellers.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger><SelectValue placeholder="Pagamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Pagamentos</SelectItem>
                      {paymentMethods.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-normal">
                {filteredSales.length} de {sales.length} {sales.length === 1 ? 'venda' : 'vendas'}
              </Badge>
              {filteredSales.length !== sales.length && (
                <>
                  <span>• Total filtrado: {formatCurrency(filteredSales.reduce((sum, s) => sum + Number(s.total_price), 0))}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setSellerFilter('all'); setPaymentMethodFilter('all'); }}>
                    <X className="w-3 h-3 mr-1" /> Limpar filtros
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={() => {
                const data = (sortField ? sortedSales : filteredSales);
                downloadCSV('vendas', ['Data', 'Produto', 'Cliente', 'Vendedor', 'Qtd', 'Preço Un.', 'Total', 'Status', 'Vencimento', 'Pagamento', 'Obs'], data.map(s => [
                  format(new Date(s.sale_date + 'T00:00:00'), 'dd/MM/yyyy'), s.product_name, s.customer_name, s.seller_name || '', String(s.quantity), String(s.unit_price), String(s.total_price), s.payment_status, s.payment_due_date ? format(new Date(s.payment_due_date + 'T00:00:00'), 'dd/MM/yyyy') : '', s.payment_method || '', s.notes || ''
                ]));
                toast.success('CSV exportado!');
              }}>
                <Download className="w-3 h-3 mr-1" /> Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Sales List */}
        {filteredSales.length > 0 ? (
          <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <Card className="shadow-card border-0 rounded-2xl">
            <CardContent className="p-0">
              <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>Data <SortIcon field="date" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('product')}>Produto <SortIcon field="product" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('customer')}>Cliente <SortIcon field="customer" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('seller')}>Vendedor <SortIcon field="seller" /></TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('qty')}>Qtd <SortIcon field="qty" /></TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('total')}>Total <SortIcon field="total" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>Status <SortIcon field="status" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('due')}>Vencimento <SortIcon field="due" /></TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('payment')}>Pagamento <SortIcon field="payment" /></TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSales.map((sale) => {
                    const isOverdue = sale.payment_status === 'pendente' && sale.payment_due_date && new Date(sale.payment_due_date + 'T00:00:00') < new Date();
                    return (
                      <TableRow key={sale.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{format(new Date(sale.sale_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <span className="mr-1.5">{getProductEmoji(sale.product_name)}</span>
                          {sale.product_name}
                        </TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">{sale.seller_name || 'Vitor'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(Number(sale.total_price))}</TableCell>
                        <TableCell>
                          <Badge
                            variant={sale.payment_status === 'pago' ? 'default' : 'secondary'}
                            className={`cursor-pointer ${sale.payment_status === 'pago' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}
                            onClick={() => togglePaymentStatus(sale.id, sale.payment_status)}
                          >
                            {sale.payment_status === 'pago' ? (<><Check className="w-3 h-3 mr-1" /> Pago</>) : (<><X className="w-3 h-3 mr-1" /> Pendente</>)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sale.payment_due_date ? (
                            <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {format(new Date(sale.payment_due_date + 'T00:00:00'), 'dd/MM/yyyy')}
                              {isOverdue && ' (Vencido)'}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{sale.payment_method || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(sale)} className="text-muted-foreground hover:text-foreground">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSale.mutate(sale.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <Card className="shadow-card border-0 rounded-2xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search || statusFilter !== 'all' ? 'Nenhuma venda encontrada com esses filtros' : 'Nenhuma venda registrada ainda. Clique em "Nova Venda" para começar.'}
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Editar Venda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Sabor / Produto *</Label>
                <Select
                  value={editFormData.product_name}
                  onValueChange={(v) => {
                    const product = products.find(p => p.name === v);
                    setEditFormData(prev => ({ ...prev, product_name: v, unit_price: product ? product.price.toString() : prev.unit_price }));
                  }}
                >
                  <SelectTrigger className="w-full bg-secondary/50 border-accent/30 focus:ring-primary/30">
                    <SelectValue placeholder="Selecione um sabor" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-accent/20 shadow-card max-h-[300px]">
                    {products.length > 0 ? (
                      (() => {
                        const grouped: Record<string, typeof products> = {};
                        products.forEach(p => {
                          const cat = (p.category || '').trim() || 'Sem categoria';
                          if (!grouped[cat]) grouped[cat] = [];
                          grouped[cat].push(p);
                        });
                        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, prods]) => (
                          <SelectGroup key={category}>
                            <SelectLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50">{category}</SelectLabel>
                            {prods.map(p => (
                              <SelectItem key={p.id} value={p.name} className="cursor-pointer hover:bg-accent/20 focus:bg-accent/30">
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatCurrency(p.price)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ));
                      })()
                    ) : (
                      <SelectItem value="none" disabled>Nenhum produto cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input
                  list="edit-customers-list"
                  value={editFormData.customer_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Digite ou selecione um cliente"
                  required
                />
                <datalist id="edit-customers-list">
                  {customers.map(c => (<option key={c.id} value={c.name} />))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" step="0.01" min="0.01" value={editFormData.quantity} onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Preço Unitário *</Label>
                  <Input type="number" step="0.01" min="0" value={editFormData.unit_price} onChange={(e) => setEditFormData(prev => ({ ...prev, unit_price: e.target.value }))} placeholder="0,00" required />
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(editTotalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editFormData.payment_status} onValueChange={(v) => setEditFormData(prev => ({ ...prev, payment_status: v as 'pago' | 'pendente' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Forma de Pagamento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                      onClick={() => setEditPaymentSplits(prev => [...prev, { method: '', amount: '' }])}
                      title="Dividir pagamento"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  {editPaymentSplits.map((split, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={split.method} onValueChange={(v) => setEditPaymentSplits(prev => prev.map((s, i) => i === idx ? { ...s, method: v } : s))}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editPaymentSplits.length > 1 && (
                        <>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="R$ valor"
                            value={split.amount}
                            onChange={(e) => setEditPaymentSplits(prev => prev.map((s, i) => i === idx ? { ...s, amount: e.target.value } : s))}
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive shrink-0"
                            onClick={() => setEditPaymentSplits(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vendedor(a)</Label>
                <Select value={editFormData.seller_name} onValueChange={(v) => setEditFormData(prev => ({ ...prev, seller_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {sellers.map(seller => (<SelectItem key={seller} value={seller}>{seller}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Venda</Label>
                  <Input type="date" value={editFormData.sale_date} onChange={(e) => setEditFormData(prev => ({ ...prev, sale_date: e.target.value }))} />
                </div>
                {editFormData.payment_status === 'pendente' && (
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input type="date" value={editFormData.payment_due_date} onChange={(e) => setEditFormData(prev => ({ ...prev, payment_due_date: e.target.value }))} min={editFormData.sale_date} className="border-warning/30 focus:ring-warning/30" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>Contato (telefone)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-primary"
                    onClick={() => setEditCustomerPhones(prev => [...prev, ''])}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {editCustomerPhones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => setEditCustomerPhones(prev => prev.map((p, i) => i === idx ? e.target.value : p))}
                      placeholder="(00) 00000-0000"
                      className="flex-1"
                    />
                    {editCustomerPhones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => setEditCustomerPhones(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={editFormData.notes} onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Observações adicionais..." />
              </div>

              <Button type="submit" className="w-full" disabled={updateSale.isPending}>
                {updateSale.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </PageTransition>
    </AppLayout>
  );
}
