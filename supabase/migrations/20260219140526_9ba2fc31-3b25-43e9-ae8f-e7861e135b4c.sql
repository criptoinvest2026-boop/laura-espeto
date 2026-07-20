
-- Drop insecure public policies
DROP POLICY IF EXISTS "Public access to products" ON public.products;
DROP POLICY IF EXISTS "Public access to customers" ON public.customers;
DROP POLICY IF EXISTS "Public access to sales" ON public.sales;
DROP POLICY IF EXISTS "Public access to expenses" ON public.expenses;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sales" ON public.sales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage expenses" ON public.expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
