import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale } from '@/types/database';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/sounds';

// Track sales created by this device to avoid self-notification
const localSaleIds = new Set<string>();

export function useSales() {
  const queryClient = useQueryClient();
  const isFirstLoad = useRef(true);

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    },
  });

  // Real-time subscription with sound notification
  useEffect(() => {
    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const newSale = payload.new as Sale;
          
          // Only play sound if it's not from this device and not first load
          if (!isFirstLoad.current && !localSaleIds.has(newSale.id)) {
            playNotificationSound('sale');
            toast.success(`Nova venda: ${newSale.product_name}`, {
              description: `Cliente: ${newSale.customer_name}`,
            });
          }
          
          // Clean up local ID after a delay
          if (localSaleIds.has(newSale.id)) {
            setTimeout(() => localSaleIds.delete(newSale.id), 5000);
          }
          
          queryClient.invalidateQueries({ queryKey: ['sales'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sales'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sales'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sales'] });
        }
      )
      .subscribe();

    // Mark first load as complete after a short delay
    setTimeout(() => {
      isFirstLoad.current = false;
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createSale = useMutation({
    mutationFn: async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();
      
      if (error) throw error;
      
      // Track this sale as created locally to avoid self-notification
      if (data) {
        localSaleIds.add(data.id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar venda');
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ...sale }: Partial<Sale> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(sale)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar venda');
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir venda');
    },
  });

  return {
    sales,
    isLoading,
    error,
    createSale,
    updateSale,
    deleteSale,
  };
}
