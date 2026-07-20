-- Add seller_name column to track who made the sale
ALTER TABLE public.sales ADD COLUMN seller_name text DEFAULT 'Vitor';