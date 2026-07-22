import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSales } from '@/hooks/useSales';
import { Product } from '@/types/database';
import { Minus, Plus, Trash2, Save, ShoppingBag, ChevronUp, ChevronDown } from 'lucide-react';
import { getProductEmoji } from '@/lib/productEmojis';
import DonenessDialog from '@/components/pdv/DonenessDialog';
import { formatNotes, parseNotes, productNeedsDoneness } from '@/lib/saleNotes';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  /** product_id + notes — o mesmo produto com pontos diferentes vira linhas separadas */
  key: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
  notes: string | null;
}

const cartKey = (productId: string, notes: string | null) => `${productId}::${notes ?? ''}`;

export default function PDV() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { sales, createSale } = useSales();

  const initialName = searchParams.get('comanda') || '';
  const [customer, setCustomer] = useState(initialName);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [donenessProduct, setDonenessProduct] = useState<Product | null>(null);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCustomer(searchParams.get('comanda') || '');
  }, [searchParams]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const c of categories) map.set(c.name, []);
    for (const p of products.filter((p) => p.is_active)) {
      const k = p.category || 'Outros';
      const arr = map.get(k) || [];
      arr.push(p);
      map.set(k, arr);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [products, categories]);

  const defaultTab = grouped[0]?.[0] || '';

  const addWithNotes = (p: Product, notes: string | null) => {
    const key = cartKey(p.id, notes);
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { key, product_id: p.id, name: p.name, price: Number(p.price), qty: 1, notes }];
    });
  };

  const addToCart = (p: Product) => {
    // Espetos/carnes perguntam o ponto antes de entrar no carrinho
    if (productNeedsDoneness(p.category)) {
      setDonenessProduct(p);
      return;
    }
    addWithNotes(p, null);
  };

  const changeQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (key: string) => setCart((prev) => prev.filter((i) => i.key !== key));

  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);

  const validateCustomer = () => {
    if (!customer.trim()) {
      toast.error('Informe a mesa ou nome do cliente');
      return false;
    }
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um item');
      return false;
    }
    return true;
  };

  // O PDV apenas cria/salva pedidos pendentes. Toda cobrança acontece na aba
  // Comandas (onde futuramente entra a integração com a maquininha de cartão).
  const savePending = async () => {
    if (!validateCustomer()) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await Promise.all(
        cart.map((item) =>
          createSale.mutateAsync({
            customer_id: null,
            product_id: item.product_id,
            product_name: item.name,
            customer_name: customer.trim(),
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.price * item.qty,
            payment_status: 'pendente',
            payment_method: null,
            sale_date: today,
            payment_due_date: null,
            notes: item.notes,
            created_by: null,
            seller_name: 'Vitor',
          })
        )
      );
      toast.success('Pedido salvo! Cobre na aba Comandas.');
      setCart([]);
      setCustomer('');
      setCartDrawerOpen(false);
      if (initialName) navigate('/comandas');
    } catch {
      toast.error('Erro ao registrar');
    }
  };

  const existingPending = sales.filter(
    (s) => s.payment_status === 'pendente' && s.customer_name === customer.trim()
  );
  const existingTotal = existingPending.reduce((a, s) => a + Number(s.total_price), 0);

  // Shared cart items list rendering (used in desktop aside and mobile drawer)
  const CartList = () => (
    <>
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 py-10">
          <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Carrinho vazio</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {cart.map((item) => {
            const { doneness, obs } = parseNotes(item.notes);
            return (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 py-2.5 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  {(doneness || obs) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {doneness && (
                        <span className="inline-block px-1.5 py-px mr-1 rounded bg-primary/10 text-primary font-medium">
                          {doneness}
                        </span>
                      )}
                      {obs}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    R$ {item.price.toFixed(2)} • Subtotal R$ {(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => changeQty(item.key, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => changeQty(item.key, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => remove(item.key)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </>
  );

  return (
    <AppLayout>
      <PageTransition>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_420px] gap-4 lg:h-[calc(100vh-4rem)] pb-32 lg:pb-0">
          {/* LEFT — products */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold leading-none">PDV</h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Toque para adicionar à comanda</p>
              </div>
            </div>

            {/* Mobile-only sticky customer input */}
            <div className="lg:hidden sticky top-0 z-20 -mx-1 px-1 pb-2 pt-1 bg-background/95 backdrop-blur-sm">
              <Input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Mesa / Cliente — ex: Mesa 5"
                className="h-11 text-base font-semibold border-2 focus-visible:border-primary"
              />
              {existingPending.length > 0 && (
                <div className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Comanda aberta: {existingPending.length} {existingPending.length === 1 ? 'item' : 'itens'} (R$ {existingTotal.toFixed(2)})
                </div>
              )}
            </div>

            <Tabs defaultValue={defaultTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-card shadow-card rounded-xl flex-nowrap sticky top-[60px] lg:top-0 z-10">
                {grouped.map(([name]) => (
                  <TabsTrigger
                    key={name}
                    value={name}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg whitespace-nowrap shrink-0"
                  >
                    {name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {grouped.map(([name, items]) => {
                const isExpanded = expandedTabs.has(name);
                const limit = 8;
                const showMore = items.length > limit;
                const visibleItems = isExpanded ? items : items.slice(0, limit);
                return (
                  <TabsContent key={name} value={name} className="flex-1 overflow-y-auto mt-3 pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                      {visibleItems.map((p) => {
                        const variants = cart.filter((c) => c.product_id === p.id);
                        const inCartQty = variants.reduce((a, c) => a + c.qty, 0);
                        const needsDoneness = productNeedsDoneness(p.category);
                        return (
                          <div
                            key={p.id}
                            className={`group relative bg-card border-2 rounded-xl p-2.5 sm:p-3 shadow-card transition-colors min-h-[88px] flex flex-col justify-between ${
                              inCartQty > 0 ? 'border-primary' : 'border-border'
                            }`}
                          >
                            <button
                              className="absolute inset-0 z-0 rounded-xl"
                              onClick={() => addToCart(p)}
                              aria-label={`Adicionar ${p.name}`}
                            />
                            <div className="flex items-start gap-1.5 relative z-10 pointer-events-none">
                              <span className="text-xl sm:text-2xl leading-none">{getProductEmoji(p.name)}</span>
                              <span className="font-semibold text-[13px] sm:text-sm leading-tight flex-1 line-clamp-2">
                                {p.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 relative z-10">
                              <span className="font-display text-base sm:text-lg font-bold text-primary">
                                R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {inCartQty > 0 && !needsDoneness ? (
                                <div className="flex items-center gap-0.5 bg-secondary/80 rounded-lg p-0.5 pointer-events-auto">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeQty(variants[0].key, -1);
                                    }}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </Button>
                                  <span className="w-5 text-center font-bold text-xs">{inCartQty}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeQty(variants[0].key, 1);
                                    }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 pointer-events-auto">
                                  {inCartQty > 0 && (
                                    <span className="min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                                      {inCartQty}
                                    </span>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(p);
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {showMore && !isExpanded && (
                      <div className="flex justify-center mt-4 mb-2">
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-12 px-6 font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={() => setExpandedTabs((prev) => new Set([...prev, name]))}
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          VER MAIS
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          {/* RIGHT — cart (desktop only) */}
          <aside className="hidden lg:flex flex-col bg-card rounded-2xl shadow-elevated border border-border overflow-hidden lg:max-h-[calc(100vh-4rem)]">
            <div className="p-4 border-b border-border bg-gradient-to-br from-primary/15 to-transparent">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Mesa / Cliente
              </label>
              <Input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Ex: Mesa 5"
                className="mt-1 text-lg font-semibold h-12 border-2 focus-visible:border-primary"
              />
              {existingPending.length > 0 && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Comanda aberta: {existingPending.length} {existingPending.length === 1 ? 'item' : 'itens'} (R$ {existingTotal.toFixed(2)})
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 min-h-[200px]">
              <CartList />
            </div>

            <div className="p-4 border-t border-border bg-card space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-3xl font-bold text-primary">
                  R$ {(total + existingTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full h-14 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                onClick={savePending}
                disabled={createSale.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar pedido
              </Button>
            </div>
          </aside>
        </div>

        {/* MOBILE — sticky bottom action bar + drawer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t-2 border-primary/30 shadow-elevated p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <Drawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="relative flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/70 active:bg-secondary border-2 border-border min-w-0"
                >
                  <div className="relative shrink-0">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Carrinho</p>
                    <p className="font-display text-lg font-bold text-primary leading-tight truncate">
                      R$ {(total + existingTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="font-display flex items-center justify-between">
                    <span>Carrinho — {customer || 'Sem mesa'}</span>
                    <span className="text-primary text-xl">
                      R$ {(total + existingTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-2">
                  <Input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Mesa / Cliente"
                    className="h-11 font-semibold border-2 focus-visible:border-primary"
                  />
                  {existingPending.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ⚠ Comanda aberta: {existingPending.length} {existingPending.length === 1 ? 'item' : 'itens'} (R$ {existingTotal.toFixed(2)})
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-4 min-h-[160px] max-h-[40vh]">
                  <CartList />
                </div>
                <div className="p-4 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    size="lg"
                    className="w-full h-14 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                    onClick={savePending}
                    disabled={createSale.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Salvar pedido
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
            <Button
              size="lg"
              className="h-[60px] px-4 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow shrink-0"
              onClick={savePending}
              disabled={createSale.isPending}
            >
              <Save className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <DonenessDialog
          open={!!donenessProduct}
          onOpenChange={(v) => !v && setDonenessProduct(null)}
          productName={donenessProduct?.name || ''}
          onConfirm={(doneness, obs) => {
            if (donenessProduct) addWithNotes(donenessProduct, formatNotes(doneness, obs));
          }}
        />
      </PageTransition>
    </AppLayout>
  );
}
