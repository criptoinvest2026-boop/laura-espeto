import { useMemo } from 'react';
import { useSales } from './useSales';
import { Sale } from '@/types/database';

export interface OpenTab {
  name: string;
  items: Sale[];
  total: number;
  itemCount: number;
  openedAt: string;
}

export function useOpenTabs() {
  const { sales, isLoading } = useSales();

  const tabs = useMemo<OpenTab[]>(() => {
    const pending = sales.filter((s) => s.payment_status === 'pendente');
    const grouped = new Map<string, Sale[]>();
    for (const s of pending) {
      const key = s.customer_name || 'Sem nome';
      const arr = grouped.get(key) || [];
      arr.push(s);
      grouped.set(key, arr);
    }
    return Array.from(grouped.entries())
      .map(([name, items]) => ({
        name,
        items,
        total: items.reduce((acc, i) => acc + Number(i.total_price), 0),
        itemCount: items.reduce((acc, i) => acc + Number(i.quantity), 0),
        openedAt: items
          .map((i) => i.created_at)
          .sort()[0],
      }))
      .sort((a, b) => (a.openedAt < b.openedAt ? -1 : 1));
  }, [sales]);

  return { tabs, isLoading };
}
