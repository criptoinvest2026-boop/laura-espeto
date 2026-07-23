import AppLayout from '@/components/layout/AppLayout';
import PageTransition from '@/components/layout/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag } from 'lucide-react';
import ProductList from '@/components/products/ProductList';
import CategoryManager from '@/components/products/CategoryManager';

export default function Products() {
  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6">
          <div className="relative">
            <h1 className="font-display text-3xl font-bold text-foreground">Produtos</h1>
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                <Package className="w-4 h-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <Tag className="w-4 h-4" />
                Categorias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ProductList />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
