# Desenho — Separação / divisão de pagamento

> **Status:** ADIADO de propósito. Implementar **depois de conectar a maquininha
> de cartão**, porque o fluxo de checkout é o ponto de integração com ela (mandar
> valor + débito/crédito). Fazer junto evita retrabalho. Este documento guarda
> todo o raciocínio pra retomar sem perder contexto.

## Problema

Uma família de ~9 pessoas ocupa 3 mesas e quer **dividir a conta**. O sistema hoje
**cola dois conceitos que na vida real nem sempre coincidem**:

- a **mesa física** (onde sentaram), e
- **quem vai pagar junto** (a conta).

Hoje a comanda é o `customer_name` (texto livre) e cobrar = marcar **todos** os
itens como pagos, de uma vez, com **um** método. A bagunça nasce quando o limite
"mesa" não bate com o limite "quem paga".

## Os 3 cenários

1. **Cada mesa paga a sua** → já funciona hoje (3 comandas separadas). Zero código.
2. **Uma conta espalhada em várias mesas** → solução é de convenção: nomear a
   comanda pelo **grupo** ("Família Silva") em vez da mesa; opcional: recurso de
   **juntar comandas** (Mesa 1+2+3 → uma conta) para quando lançaram separado.
3. **Uma conta, vários pagadores** (racha por igual / vários cartões / "eu pago o
   meu") → **único que precisa de recurso novo**: pagamento parcial que abate a nota.

## Dois modos de dividir (têm implicações diferentes de dados)

- **Por seleção de item** — seleciona itens, paga, eles saem da nota. **Encaixa no
  modelo atual sem migração**: cada item já é uma linha com seu próprio
  `payment_method`. O relatório sai discriminado por método naturalmente.
- **Por valor / racha por igual** — R$270 ÷ 9 = R$30 cada. **Não mapeia em itens**
  (R$30 não corresponde a produtos específicos) → precisa de um registro de pagamentos.

## Arquitetura recomendada

**Tabela nova `payments`** (livro-caixa da comanda) como fonte da verdade de
"quem pagou quanto e como":

```
payments: id, comanda_ref (customer_name + sale_date, ou um comanda_id futuro),
          amount, method, created_at, item_ids (opcional, quando pagou por item)
```

- Total da comanda = soma dos itens; Pago = soma dos `payments`; Saldo = total − pago.
- Comanda fecha quando **saldo ≤ 0**.
- **Por item:** o pagamento cobre itens específicos, marca-os pagos e abate.
- **Por valor:** pagamento de R$X; quando o saldo zera, marca os itens restantes.

Migração é **aditiva** (tabela nova, não mexe em `sales`) → risco baixo.

**Alternativa sem migração (menos robusta):** manter só o `payment_method` por
linha para o modo "por item", e registrar o racha como método combinado em string
(ex.: `"Misto: 3×Crédito, 4×Dinheiro, 2×PIX"`). Funciona, mas o relatório teria que
"parsear" a string — frágil. Preferir a tabela `payments` se o racha por valor
precisar de breakdown no relatório.

## Relatório

Na seção **"Vendas por Comanda"** (já existe), cada comanda mostra o breakdown:
`Dinheiro R$X • Débito R$Y • Crédito R$Z • PIX R$W`, deixando claro que foi
fracionado.

## UX do checkout (aba Comandas)

- "Cobrar" abre os itens com **checkbox**.
- Seleciona itens → vê subtotal → escolhe método → **"Receber"** → abate da nota.
- Repete até zerar. Botão **"Selecionar tudo"** para o caso comum (paga tudo).
- Modo **"Dividir por igual"**: divide o total por N e vai recebendo N pagamentos.

## Decisões em aberto (confirmar ao retomar)

1. **Racha por valor precisa de breakdown no relatório?** Se sim → tabela `payments`.
   Se raro/pode ir como texto → dá pra começar só com "por item" sem migração.
2. **Comprovante impresso:** um por pagamento parcial (cada pagador leva o seu) ou
   só um no fim?
3. **Débito e crédito separados no relatório?** → já resolvido: vamos gravar
   `"Cartão Débito"` / `"Cartão Crédito"`, então aparecem separados naturalmente.

## Já implementado nesta rodada (base para o resto)

- **Cartão → Débito/Crédito** no checkout: ao escolher Cartão, abre a escolha
  Débito/Crédito; grava `"Cartão Débito"` / `"Cartão Crédito"`. Isso já prepara o
  breakdown por método e o envio do tipo à maquininha no futuro.

## Relação com a maquininha

Quando a integração com a maquininha entrar, **cada pagamento** (por item ou por
valor) vira uma chamada à máquina com **valor + débito/crédito**. Por isso o checkout
é o ponto natural de integração, e por isso a divisão de pagamento foi adiada para
ser feita **junto** com ela. Ver plano de integração da maquininha quando existir.
