import { useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { useExpenses } from '@/hooks/useExpenses';
import { useOpenTabs } from '@/hooks/useOpenTabs';
import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet,
  ClipboardList,
  Flame,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { tabs } = useOpenTabs();

  const today = new Date().toISOString().split('T')[0];
  const todaySalesPaid = sales.filter((s) => s.sale_date === today && s.payment_status === 'pago');
  const todayExpenses = expenses.filter((e) => e.expense_date === today);

  const totalIn = todaySalesPaid.reduce((a, s) => a + Number(s.total_price), 0);
  const totalOut = todayExpenses.reduce((a, e) => a + Number(e.amount), 0);
  const profit = totalIn - totalOut;
  const openTotal = tabs.reduce((a, t) => a + t.total, 0);

  const recentSales = todaySalesPaid.slice(0, 6);

  const stats = [
    { label: 'Vendas do dia', value: totalIn, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Custos do dia', value: totalOut, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Lucro do dia', value: profit, icon: Wallet, color: profit >= 0 ? 'text-primary' : 'text-destructive', bg: 'bg-primary/10' },
    { label: 'Comandas abertas', value: openTotal, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: `${tabs.length} ${tabs.length === 1 ? 'comanda' : 'comandas'}` },
  ];

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <Flame className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Deus Proveu Espetos</h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-glow"
              onClick={() => navigate('/pdv')}
            >
              <Plus className="w-5 h-5 mr-2" /> Nova venda
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 shadow-card">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {s.label}
                  </p>
                  <p className={`font-display text-2xl font-bold mt-1 ${s.color}`}>
                    R$ {s.value.toFixed(2)}
                  </p>
                  {s.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>}
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Comandas abertas
                </h2>
                <Button size="sm" variant="ghost" onClick={() => navigate('/comandas')}>
                  Ver todas
                </Button>
              </div>
              {tabs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma comanda aberta</p>
              ) : (
                <div className="space-y-2">
                  {tabs.slice(0, 5).map((t) => (
                    <button
                      key={t.name}
                      onClick={() => navigate(`/pdv?comanda=${encodeURIComponent(t.name)}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                    >
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.itemCount} itens</p>
                      </div>
                      <span className="font-display text-lg font-bold text-primary">
                        R$ {t.total.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Últimas vendas do dia
                </h2>
                <Button size="sm" variant="ghost" onClick={() => navigate('/caixa')}>
                  Ver caixa
                </Button>
              </div>
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda hoje</p>
              ) : (
                <div className="space-y-2">
                  {recentSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.product_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.customer_name} • {format(new Date(s.created_at), 'HH:mm')}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600 text-sm">
                        R$ {Number(s.total_price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
