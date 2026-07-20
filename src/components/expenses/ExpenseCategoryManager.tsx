import { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ExpenseCategoryManager() {
  const { categories, createCategory, deleteCategory, isLoading } = useExpenseCategories();
  const [newName, setNewName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCategory.mutateAsync(newName.trim());
    setNewName('');
  };

  if (isLoading) return <div className="animate-pulse text-primary p-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria de custo..."
          className="flex-1"
        />
        <Button type="submit" disabled={createCategory.isPending} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </form>

      <div className="grid gap-2">
        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="shadow-sm border-0">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                      <AlertDialogDescription>Os custos dessa categoria não serão excluídos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCategory.mutate(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
