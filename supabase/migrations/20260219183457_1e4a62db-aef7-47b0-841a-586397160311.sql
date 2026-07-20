
-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Anyone can manage expense categories"
ON public.expense_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Seed with existing categories
INSERT INTO public.expense_categories (name) VALUES
  ('Embalagens'),
  ('Equipamentos'),
  ('Ingredientes'),
  ('Outros'),
  ('Transporte');
