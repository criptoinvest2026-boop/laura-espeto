-- Marca se um item do pedido já foi entregue ao cliente.
-- Usado para acompanhar entrega item a item nas comandas (evita esquecer ou
-- entregar em duplicidade). Idempotente e com default seguro para dados antigos.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS delivered boolean NOT NULL DEFAULT false;
