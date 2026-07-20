
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create permissive policies for all users (no auth required)
CREATE POLICY "Anyone can manage expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);
