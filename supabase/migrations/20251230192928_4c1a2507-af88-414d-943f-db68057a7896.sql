-- Drop existing public access policies
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all access to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;

-- Create authenticated-only policies for products
CREATE POLICY "Authenticated users can select products" 
ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON public.products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products" 
ON public.products FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for customers
CREATE POLICY "Authenticated users can select customers" 
ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for sales
CREATE POLICY "Authenticated users can select sales" 
ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales" 
ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales" 
ON public.sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales" 
ON public.sales FOR DELETE TO authenticated USING (true);

-- Create authenticated-only policies for expenses
CREATE POLICY "Authenticated users can select expenses" 
ON public.expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses" 
ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses" 
ON public.expenses FOR DELETE TO authenticated USING (true);