-- Add payment due date column to sales table
ALTER TABLE public.sales 
ADD COLUMN payment_due_date date DEFAULT NULL;