import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Search, Trash2, Edit, Users as UsersIcon, Phone, Mail, ArrowUpDown, ArrowUp, ArrowDown, X, Download, Filter, Heart } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import ConfectioneryDecor from '@/components/decorations/ConfectioneryDecor';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csv';
import { Customer } from '@/types/database';

export default function Customers() {
  const { customers, createCustomer, updateCustomer, deleteCustomer, isLoading } = useCustomers();
  const { sales } = useSales();
  
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'contact' | 'sales' | 'total' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
    setEditingCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Preencha o nome do cliente');
      return;
    }

    const customerData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      notes: formData.notes || null,
    };

    if (editingCustomer) {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, ...customerData });
    } else {
      await createCustomer.mutateAsync(customerData);
    }

    resetForm();
    setOpen(false);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const currentMonth = format(new Date(), 'yyyy-MM');

  const getCustomerStats = (customerName: string) => {
    const customerSales = sales.filter(s => s.customer_name === customerName && s.sale_date.startsWith(currentMonth));
    const totalPurchases = customerSales.reduce((acc, s) => acc + Number(s.total_price), 0);
    return {
      salesCount: customerSales.length,
      totalPurchases,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSort = (field: 'name' | 'contact' | 'sales' | 'total') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'contact' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline" /> 
      : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(search.toLowerCase())) ||
      (customer.phone && customer.phone.includes(search));
    const stats = getCustomerStats(customer.name);
    const matchesPurchase = purchaseFilter === 'all' ||
      (purchaseFilter === 'with' && stats.salesCount > 0) ||
      (purchaseFilter === 'without' && stats.salesCount === 0);
    const matchesContact = contactFilter === 'all' ||
      (contactFilter === 'with' && (customer.phone || customer.email)) ||
      (contactFilter === 'without' && !customer.phone && !customer.email);
    return matchesSearch && matchesPurchase && matchesContact;
  });

  const hasActiveFilters = search !== '' || purchaseFilter !== 'all' || contactFilter !== 'all';
  const clearFilters = () => { setSearch(''); setPurchaseFilter('all'); setContactFilter('all'); };

  const sortedCustomers = useMemo(() => {
    if (!sortField) return filteredCustomers;
    return [...filteredCustomers].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'contact': {
          const aHas = a.phone || a.email ? 1 : 0;
          const bHas = b.phone || b.email ? 1 : 0;
          return dir * (aHas - bHas);
        }
        case 'sales': {
          const aStats = getCustomerStats(a.name);
          const bStats = getCustomerStats(b.name);
          return dir * (aStats.salesCount - bStats.salesCount);
        }
        case 'total': {
          const aStats = getCustomerStats(a.name);
          const bStats = getCustomerStats(b.name);
          return dir * (aStats.totalPurchases - bStats.totalPurchases);
        }
        default:
          return 0;
      }
    });
  }, [filteredCustomers, sortField, sortDirection]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-primary">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

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
            <ConfectioneryDecor variant="customers" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Clientes</h1>
                <p className="text-muted-foreground/70 text-xs mt-0.5">
                  {customers.length} cliente{customers.length !== 1 ? 's' : ''} • dados do mês atual
                </p>
              </div>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anotações sobre o cliente"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createCustomer.isPending || updateCustomer.isPending}>
                  {createCustomer.isPending || updateCustomer.isPending 
                    ? 'Salvando...' 
                    : editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Card className="shadow-card border-0 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="default" className="gap-2 shrink-0" onClick={() => setShowFilters(prev => !prev)}>
                <Filter className="w-4 h-4" />
                Filtros
                {(purchaseFilter !== 'all' || contactFilter !== 'all') && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {[purchaseFilter, contactFilter].filter(f => f !== 'all').length}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
                    <SelectTrigger><SelectValue placeholder="Compras" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Compras</SelectItem>
                      <SelectItem value="with">Com compras</SelectItem>
                      <SelectItem value="without">Sem compras</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={contactFilter} onValueChange={setContactFilter}>
                    <SelectTrigger><SelectValue placeholder="Contato" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Contatos</SelectItem>
                      <SelectItem value="with">Com contato</SelectItem>
                      <SelectItem value="without">Sem contato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
              {hasActiveFilters && (
                <>
                  <Badge variant="outline" className="font-normal">
                    {filteredCustomers.length} de {customers.length} cliente{customers.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" /> Limpar filtros
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={() => {
                const data = sortedCustomers;
                downloadCSV('clientes', ['Nome', 'Telefone', 'E-mail', 'Compras', 'Total Gasto', 'Observações'], data.map(c => {
                  const stats = getCustomerStats(c.name);
                  return [c.name, c.phone || '', c.email || '', String(stats.salesCount), formatCurrency(stats.totalPurchases), c.notes || ''];
                }));
                toast.success('CSV exportado!');
              }}>
                <Download className="w-3 h-3 mr-1" /> Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Customers Table */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
        <Card className="shadow-card border-0 rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    Cliente <SortIcon field="name" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('contact')}>
                    Contato <SortIcon field="contact" />
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('sales')}>
                    Compras <SortIcon field="sales" />
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('total')}>
                    Total Gasto <SortIcon field="total" />
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.length > 0 ? (
                  sortedCustomers.map((customer) => {
                    const stats = getCustomerStats(customer.name);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                              <UsersIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium">{customer.name}</span>
                              {customer.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {customer.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </div>
                            )}
                            {!customer.phone && !customer.email && (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {stats.salesCount} venda{stats.salesCount !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(stats.totalPurchases)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(customer)}
                            >
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
                                  <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. As vendas já registradas não serão afetadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCustomer.mutate(customer.id)}
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
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {search 
                        ? 'Nenhum cliente encontrado com esse termo'
                        : 'Nenhum cliente cadastrado ainda. Clique em "Novo Cliente" para começar.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </motion.div>
      </div>
      </PageTransition>
    </AppLayout>
  );
}
