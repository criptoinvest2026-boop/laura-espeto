import { useState } from 'react';
import { Plus, Search, Trash2, Edit, Package, X, Ban, PackageCheck } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Product } from '@/types/database';
import { getProductEmoji } from '@/lib/productEmojis';

export default function ProductList() {
  const { products, createProduct, updateProduct, deleteProduct, isLoading } = useProducts();
  const { categories } = useCategories();

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: 'unidade',
    category: '',
  });

  const resetForm = () => {
    setFormData({ name: '', price: '', unit: 'unidade', category: '' });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit || 'unidade',
      category: product.category || '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Preencha o nome e o preço do produto');
      return;
    }
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      unit: formData.unit,
      category: formData.category || null,
      is_active: true,
    };
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }
    resetForm();
    setOpen(false);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || (p.category || 'Sem categoria') === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = search !== '' || categoryFilter !== 'all';
  const clearFilters = () => { setSearch(''); setCategoryFilter('all'); };

  // Esgotado = produto inativo (some do PDV, não pode ser vendido).
  const toggleAvailable = (product: Product) => {
    updateProduct.mutateAsync({ id: product.id, is_active: !product.is_active });
    toast.success(product.is_active ? `${product.name} marcado como esgotado` : `${product.name} disponível novamente`);
  };

  // Group by category
  const grouped = filteredProducts.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-primary">Carregando...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-muted-foreground">
          {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
        </p>

        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Coxinha de Morango"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="kg">Quilo (kg)</SelectItem>
                      <SelectItem value="cento">Cento</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending
                  ? 'Salvando...'
                  : editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
                <SelectItem value="Sem categoria">Sem categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-normal">
                {filteredProducts.length} de {products.length} produto{products.length !== 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products grouped by category */}
      <Card className="shadow-card border-0">
        <CardContent className="p-2">
          {Object.keys(grouped).length > 0 ? (
            <Accordion type="multiple">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, prods]) => (
                <AccordionItem key={category} value={category} className="border-b last:border-0">
                  <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {category}
                      <Badge variant="secondary" className="ml-1">{prods.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Preço</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prods.map((product) => (
                          <TableRow key={product.id} className={product.is_active ? '' : 'opacity-60'}>
                            <TableCell className="font-medium">
                              <span className="mr-2 text-lg">{getProductEmoji(product.name)}</span>
                              {product.name}
                              {!product.is_active && (
                                <Badge variant="secondary" className="ml-2 bg-destructive/15 text-destructive text-[10px] uppercase">
                                  Esgotado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(Number(product.price))}</TableCell>
                            <TableCell className="capitalize">{product.unit}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={product.is_active ? 'Marcar como esgotado' : 'Marcar como disponível'}
                                  className={product.is_active ? 'text-amber-600 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-600'}
                                  onClick={() => toggleAvailable(product)}
                                >
                                  {product.is_active ? <Ban className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
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
                                      <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteProduct.mutate(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              {search ? 'Nenhum produto encontrado com esse termo' : 'Nenhum produto cadastrado ainda.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
