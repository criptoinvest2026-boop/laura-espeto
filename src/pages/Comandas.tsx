import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import { useOpenTabs } from '@/hooks/useOpenTabs';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClipboardList, Plus, CreditCard, Trash2, Clock, ChevronDown, Pencil } from 'lucide-react';
import CheckoutModal from '@/components/pdv/CheckoutModal';
import EditComandaModal from '@/components/comandas/EditComandaModal';
import TabItemsList from '@/components/comandas/TabItemsList';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { printReceipt } from '@/lib/printReceipt';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Comandas() {
  const { tabs } = useOpenTabs();
  const { updateSale, deleteSale } = useSales();
  const { products } = useProducts();
  const navigate = useNavigate();
  const [checkoutTab, setCheckoutTab] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.name === checkoutTab);
  const editingTab = tabs.find((t) => t.name === editTab) ?? null;
  const categoryOf = (name: string) => products.find((p) => p.name === name)?.category ?? null;

  const handleCharge = async (method: string) => {
    if (!activeTab) return;
    try {
      await Promise.all(
        activeTab.items.map((s) =>
          updateSale.mutateAsync({ id: s.id, payment_status: 'pago', payment_method: method })
        )
      );
      printReceipt({
        customer: activeTab.name,
        items: activeTab.items.map((s) => ({
          name: s.product_name,
          qty: Number(s.quantity),
          unitPrice: Number(s.unit_price),
          total: Number(s.total_price),
          notes: s.notes ?? undefined,
        })),
        total: activeTab.total,
        paymentMethod: method,
      });
      toast.success(`Comanda ${activeTab.name} finalizada!`);
      setCheckoutTab(null);
    } catch {
      toast.error('Erro ao cobrar');
    }
  };

  const handleCancel = async () => {
    if (!confirmDelete) return;
    const tab = tabs.find((t) => t.name === confirmDelete);
    if (!tab) return;
    try {
      await Promise.all(tab.items.map((s) => deleteSale.mutateAsync(s.id)));
      toast.success('Comanda cancelada');
      setConfirmDelete(null);
    } catch {
      toast.error('Erro ao cancelar');
    }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">Comandas Abertas</h1>
              <p className="text-xs text-muted-foreground">
                {tabs.length} {tabs.length === 1 ? 'comanda em andamento' : 'comandas em andamento'}
              </p>
            </div>
            <Button onClick={() => navigate('/pdv')} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <Plus className="w-4 h-4 mr-1" />
              Nova venda
            </Button>
          </div>

          {tabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60">
              <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
              <p>Nenhuma comanda aberta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence initial={false}>
                {tabs.map((tab) => (
                  <motion.div
                    key={tab.name}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="p-4 shadow-card hover:shadow-elevated transition-shadow border-2 border-border hover:border-primary/40">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-display text-xl font-bold">{tab.name}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {format(new Date(tab.openedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(tab.openedAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <span className="text-xs font-bold uppercase px-2 py-1 rounded-md bg-warning/15 text-warning">
                          Aberta
                        </span>
                      </div>

                      <Collapsible>
                        <CollapsibleTrigger className="w-full flex items-center justify-between py-2 border-t border-border text-left group">
                          <span className="text-xs text-muted-foreground">
                            {tab.itemCount} {tab.itemCount === 1 ? 'item' : 'itens'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-display text-2xl font-bold text-primary">
                              R$ {tab.total.toFixed(2)}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="max-h-40 overflow-y-auto pb-2">
                            <TabItemsList items={tab.items} />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="mt-3 space-y-1.5">
                        <Button
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                          onClick={() => setCheckoutTab(tab.name)}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Cobrar
                        </Button>
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/pdv?comanda=${encodeURIComponent(tab.name)}`)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditTab(tab.name)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmDelete(tab.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <CheckoutModal
          open={!!checkoutTab}
          onOpenChange={(v) => !v && setCheckoutTab(null)}
          total={activeTab?.total || 0}
          onConfirm={handleCharge}
          loading={updateSale.isPending}
        />

        <EditComandaModal
          open={!!editTab}
          onOpenChange={(v) => !v && setEditTab(null)}
          tab={editingTab}
          categoryOf={categoryOf}
        />

        <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar comanda?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os itens da comanda {confirmDelete} serão removidos. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive">
                Cancelar comanda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </AppLayout>
  );
}
