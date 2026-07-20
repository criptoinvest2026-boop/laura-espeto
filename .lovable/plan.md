# Plano: PDV Top Espetos

Vou transformar o sistema atual em um PDV ágil, otimizado para uso em balcão/tablet, mantendo a base técnica existente (Lovable Cloud, React, shadcn, realtime).

## 1. Identidade visual
- Sidebar permanece dark com dourado (já está).
- Área principal: manter suporte a dark/claro (já implementado), mas ajustar tokens para alto contraste e botões grandes touch-friendly (min-h 80px nos botões de produto).
- Botões grandes, tipografia legível, foco em uso rápido.

## 2. Estrutura de menus (sidebar)
Substituir itens atuais por:
1. **Dashboard** (`/`) — resumo do dia
2. **PDV** (`/pdv`) — nova venda (tela principal)
3. **Comandas** (`/comandas`) — pedidos abertos
4. **Fluxo de Caixa** (`/caixa`) — entradas e saídas
5. **Produtos** (`/produtos`) — cardápio
6. **Relatórios** (`/relatorios`) — gráficos

Remover Clientes e Custos antigos (Fluxo de Caixa absorve os custos; cliente vira só "Nome/Comanda" no PDV).

## 3. Banco de dados
- Recarregar produtos: limpar tabelas `products` e `categories`, inserir as 5 categorias e ~60 produtos com preços exatos do briefing.
- Reutilizar `sales` para itens vendidos. Como cada comanda pode ter vários itens, vou usar o campo `customer_name` como identificador da comanda (ex.: "Mesa 5" / "João") e `payment_status` (`pendente` = comanda aberta, `pago` = finalizada). Agrupar por `customer_name + sale_date` quando `payment_status='pendente'` para formar comandas abertas.
- Migration para adicionar categorias de custo padrão (Carnes, Bebidas, Aluguel, Funcionários, Gás, Embalagens, Outros) em `expense_categories`.

## 4. Tela PDV (`/pdv`) — coração do sistema
Layout split 70/30 (em mobile vira tabs):

```text
+--------------------------------------+----------------+
| [Espetos Simples][Jantinhas][Acomp.] | Comanda        |
| [Bebidas][Cervejas]                  | Nome: ______   |
|                                      | ---------------|
| [Carne     ] [Coração  ] [Frango  ]  | 2x Carne  26,00|
| [R$ 13,00  ] [R$ 14,00 ] [R$ 14,00]  | 1x Coração 14  |
|                                      | ---------------|
| [Queijo    ] [Alcatra  ] [Kafta   ]  | Total: R$ 40   |
|  ...                                  | [Salvar][Cobrar]
+--------------------------------------+----------------+
```

- Esquerda: tabs por categoria; cada produto é botão grande (nome + preço). Clique = adiciona ao carrinho (incrementa se já existe).
- Direita: input "Nome/Mesa", lista com `−  qty  +`, botão remover, total grande, dois CTAs:
  - **Salvar Comanda**: cria vendas em `sales` com `payment_status='pendente'`.
  - **Cobrar/Finalizar**: abre modal com método (PIX/Cartão/Dinheiro) e grava `payment_status='pago'`.
- Se o usuário entrou no PDV vindo da tela "Comandas" (com `?comanda=Mesa+5`), pré-carrega itens existentes pendentes daquele cliente para continuar adicionando.

## 5. Tela Comandas (`/comandas`)
- Grid de cards, um por comanda aberta (agrupada por `customer_name`, somente do dia, `payment_status='pendente'`).
- Cada card: nome, qtd itens, total, tempo aberto, botões "Adicionar itens" (vai pro PDV com a comanda), "Cobrar" (modal pagamento que marca todos os itens como pagos), "Cancelar".

## 6. Tela Fluxo de Caixa (`/caixa`)
- Filtro de data (dia/mês), padrão hoje.
- Cards no topo: Entradas, Saídas, Saldo.
- Duas abas/tabelas: Entradas (vendas pagas) e Saídas (custos). Tabela com paginação.
- Botão "Novo Custo" abre modal: descrição, valor, categoria (select de `expense_categories` + criar nova), data.
- Sub-aba "Categorias de Custos" para CRUD.

## 7. Dashboard (`/`)
4 stats cards (Vendas do Dia, Custos do Dia, Lucro do Dia, Comandas Abertas) + mini-lista das últimas vendas e comandas abertas.

## 8. Produtos (`/produtos`)
Mantém estrutura atual (já tem produtos + categorias com accordion).

## 9. Relatórios (`/relatorios`)
Mantém + ajusta: vendas por mês (line chart), top produtos (bar chart), receita por categoria.

## Detalhes técnicos
- Rotas em `src/App.tsx` atualizadas, sidebar nav atualizada.
- Novas páginas: `src/pages/PDV.tsx`, `src/pages/Comandas.tsx`, `src/pages/CashFlow.tsx`. Remover `Customers.tsx` e `Expenses.tsx` da nav (manter arquivo, sem rota, ou deletar).
- Componente `CheckoutModal` reutilizado em PDV e Comandas.
- Hook `useOpenTabs` que agrupa `sales` pendentes do dia por `customer_name`.
- Seed via tool `supabase--insert` após confirmação.
- Sem auth (sistema público, conforme memória).

Confirma o plano para eu implementar?
