import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export function useExpenseCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('expense-categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('expense_categories').insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expense_categories'] }); toast.success('Categoria criada!'); },
    onError: () => { toast.error('Erro ao criar categoria'); },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expense_categories'] }); toast.success('Categoria excluída!'); },
    onError: () => { toast.error('Erro ao excluir categoria'); },
  });

  return { categories, isLoading, createCategory, deleteCategory };
}
