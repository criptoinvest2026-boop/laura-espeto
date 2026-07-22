# Deus Proveu Espetos — Guia de Instalação e Contexto

Documento de referência para reinstalar / configurar o sistema em um novo
dispositivo (PC do caixa) e entender tudo que foi alterado no projeto.

- **Projeto:** PDV (ponto de venda) para barraca de espetinhos "Deus Proveu Espetos"
- **Repositório GitHub:** `criptoinvest2026-boop/laura-espeto`
- **Tecnologias:** React + Vite + TypeScript + Tailwind + Supabase (gerado no Lovable)
- **Impressora:** Knup **KP-IM607** (térmica 58mm, ESC/POS, USB)

---

## 1. Visão geral rápida

O app roda no navegador (site publicado pelo Lovable, ou localmente). Quando o
caixa fecha uma comanda, o app gera um **recibo em ESC/POS** e envia para um
**pequeno programa local** (a "ponte de impressão") que roda no PC do caixa e
imprime na Knup em modo RAW.

Por que essa ponte existe: a impressão gráfica normal do Windows
(`window.print()` → driver) **trava** nessa impressora (fica em "0 páginas"
para sempre). Enviando os bytes ESC/POS em modo **RAW**, imprime perfeitamente.
A ponte faz exatamente isso.

```
[Navegador com o app] --HTTP--> [Ponte print-helper.ps1 em localhost:9100] --RAW--> [Impressora Knup]
```

---

## 2. O que instalar num dispositivo novo (passo a passo)

### 2.1. Driver da impressora Knup KP-IM607

1. Baixe o driver no OneDrive oficial da Knup (link no site
   `knup.com.br/suporte-tecnico/`):
   - Link direto da pasta: <https://1drv.ms/f/s!AiW3KAW-tBdwgWnSq2a2xhGOjSzp?e=aIDzJ9>
   - Caminho dentro do OneDrive: **Informática → Impressoras Térmicas → `KP-IM607 - Driver.rar`**
2. Extraia o `.rar` (WinRAR ou 7-Zip) e rode o `KP-IM607.exe`.
3. Na tela "Driver setup and config":
   - Sistema operacional: marque **Windows 10** (funciona no Windows 11 também —
     não existe opção "Windows 11" no instalador, e isso é normal).
   - Select Printer: **POS-58 Series Printer**.
   - Deixe marcado "Set as default printer" e "Create Shortcuts".
   - Clique em **USB Port Check** ANTES de instalar (detecta a porta USB).
   - Clique em **Begin Setup**.

> O instalador cria várias filas (POS-58, POS-80, LABEL...). A que importa é a
> que fica ligada na **porta USB** (ex.: `USB001`). Se a fila "POS-58" ficar na
> porta `LPT1:`, aponte-a manualmente para a porta USB (ver Solução de Problemas).

### 2.2. A ponte de impressão (não precisa instalar nada)

A ponte é o arquivo **`print-helper/print-helper.ps1`** deste repositório. Ela
usa apenas o PowerShell **nativo do Windows** — nenhuma instalação necessária.

Para testar manualmente:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "CAMINHO\print-helper\print-helper.ps1"
```
Deve aparecer: `Ponte de impressao ativa em http://localhost:9100/`.

### 2.3. Fazer a ponte iniciar sozinha com o Windows

1. Abra a pasta de inicialização: **Win+R** → digite `shell:startup` → Enter.
2. Crie um **atalho** para o arquivo `print-helper/iniciar-impressora.vbs`
   (clique direito no `.vbs` → "Enviar para" → "Área de trabalho", depois mova
   o atalho para a pasta que abriu no passo 1).
   - O `.vbs` inicia a ponte **sem abrir janela preta**.
3. Pronto: ao ligar o PC, a impressão já funciona.

### 2.4. Navegador

Qualquer navegador moderno serve (Chrome, Edge, etc.). Basta abrir o app:
- **Site publicado (Lovable):** use a URL do projeto publicado.
- **Ou localmente** (modo desenvolvimento) — ver seção 4.

> Observação: o app faz `fetch` para `http://localhost:9100`. O navegador
> permite isso mesmo o site sendo HTTPS, porque `localhost` é considerado
> endereço confiável. Não precisa de configuração extra.

---

## 3. Como funciona a ponte (referência técnica)

- **Arquivo:** `print-helper/print-helper.ps1`
- **Porta:** `http://localhost:9100`
- **Endpoints:**
  - `GET /status` → `{ ok: true, printer: "<nome da impressora detectada>" }`
  - `POST /print` com corpo JSON `{ "data": "<bytes ESC/POS em base64>", "printer": "opcional" }`
- **Como envia à impressora:** via API `winspool` do Windows (`WritePrinter`)
  no modo **RAW** — contorna a renderização gráfica (EMF) que trava.
- **Detecção automática da impressora:** procura uma fila cujo nome contenha
  `POS`, `58`, `IM60`, `thermal`; senão pega a que estiver numa porta `USB`;
  senão a impressora padrão do Windows.

Dados técnicos da impressora (úteis para diagnóstico):
- **Modelo:** Knup KP-IM607, 58mm, ESC/POS, alimentação DC 9V (fonte própria).
- **Chip USB:** `VID_6868` / `PID_0200` (chipset genérico de térmica).

---

## 4. Rodar o app localmente (modo desenvolvimento)

Só necessário se você for editar/rodar o código na máquina (não é preciso para
apenas usar o site publicado).

1. Instalar **Node.js LTS**:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
2. Instalar dependências e subir o servidor:
   ```powershell
   cd CAMINHO\laura-espeto
   npm install
   npm run dev
   ```
3. Abrir <http://localhost:8080>.

A configuração do Supabase fica no arquivo `.env` (já versionado no repositório).

---

## 5. Alterações feitas no projeto (histórico)

### Impressão de recibo (principal)
- Criado **`src/lib/printReceipt.ts`** — monta o recibo em ESC/POS e envia para
  a ponte HTTP local. Evolução da abordagem até chegar na solução final:
  1. `window.print()` via iframe → **travava** na impressora.
  2. WebUSB (bytes direto no USB) → exigia trocar driver (Zadig) e dava
     "Access Denied"; abandonado.
  3. **Ponte HTTP + RAW ESC/POS** (solução atual) → funciona em qualquer
     navegador, sem trocar driver.
- **`src/pages/PDV.tsx`** e **`src/pages/Comandas.tsx`** — ao confirmar o
  pagamento de uma comanda, chamam `printReceipt(...)` automaticamente.
- Criada a pasta **`print-helper/`** com:
  - `print-helper.ps1` — o servidor local de impressão.
  - `iniciar-impressora.vbs` — inicia a ponte sem janela (para o auto-início).

### Nome do negócio
- Ajustado de "Bella Doces" (herança do template) → "Top Espetos" →
  **"Deus Proveu Espetos"** em todos os pontos visíveis: recibo, logo da
  sidebar, dashboard, tela "Instalar App", título da aba e meta tags
  (`index.html`).

### Layout do recibo
- Título do recibo ("Deus Proveu Espetos") impresso em **tamanho normal**
  (negrito, centralizado) — antes era tamanho dobrado e quebrava linha por ser
  um nome longo.

### Banco de dados (somente ambiente de teste local)
- O Supabase de teste (`.env`, projeto `zdxxvwjqjfyhkbqakjri`) estava vazio;
  foram inseridos o cardápio e as categorias para permitir testes no localhost.
- **Atenção:** o app **publicado** usa outro Supabase, com o cardápio real.
  Esse cadastro de teste não afeta o app publicado.

---

## 6. Solução de problemas

**Nada imprime / o app mostra "Não foi possível imprimir".**
- Confirme que a ponte está rodando: abra <http://localhost:9100/status> no
  navegador. Deve mostrar `{"ok":true,"printer":"..."}`.
- Se não abrir, inicie a ponte (seção 2.2) ou reinicie o PC (auto-início).

**A ponte mostra "Nenhuma impressora encontrada".**
- A impressora não está instalada/ligada. Reveja a seção 2.1.
- Verifique em *Configurações → Impressoras e scanners* se aparece uma fila
  tipo "POS-58" ou "POS58...".

**A fila "POS-58" está na porta `LPT1:` em vez de USB.**
- Descubra a porta USB real (geralmente `USB001`) e aponte a fila para ela:
  ```powershell
  Set-Printer -Name "POS-58" -PortName "USB001"
  ```
  (troque o nome/porta conforme o que aparecer em *Impressoras e scanners*.)

**Windows diz "Dispositivo USB não reconhecido" ou a impressora some.**
- É problema de **conexão física** (cabo ou porta), não de software:
  - Troque o cabo USB (muitos cabos baratos só carregam, não transmitem dados).
  - Use uma porta USB-A direto no PC (sem hub/extensão).
  - Confirme que a impressora está ligada na tomada (fonte DC 9V própria) com a
    luz verde acesa.

**Imprimiu tudo embaralhado / caracteres errados.**
- Verifique se a fila usada é uma do tipo POS/térmica (ESC/POS), não um driver
  de etiqueta. A ponte já prioriza filas POS automaticamente.

---

## 7. Arquivos e referências importantes

| Item | Onde |
|------|------|
| Lógica do recibo (ESC/POS) | `src/lib/printReceipt.ts` |
| Disparo da impressão | `src/pages/PDV.tsx`, `src/pages/Comandas.tsx` |
| Ponte de impressão | `print-helper/print-helper.ps1` |
| Auto-início (sem janela) | `print-helper/iniciar-impressora.vbs` |
| Config do Supabase | `.env` |
| Driver da impressora | OneDrive Knup → Informática → Impressoras Térmicas → `KP-IM607 - Driver.rar` |
| Suporte Knup | `knup.com.br/suporte-tecnico/` · WhatsApp +55 11 91196-2124 |
