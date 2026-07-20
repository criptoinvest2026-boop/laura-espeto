export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  product_id: string | null;
  product_name: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: 'pago' | 'pendente';
  payment_method: string | null;
  sale_date: string;
  payment_due_date: string | null;
  notes: string | null;
  created_by: string | null;
  seller_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export type PaymentStatus = 'pago' | 'pendente';
export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão' | 'Transferência';
