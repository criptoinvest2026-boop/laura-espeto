import { toast } from 'sonner';

const BUSINESS_NAME = 'Deus Proveu Espetos';

// Recibos sao enviados como bytes ESC/POS crus para uma ponte HTTP local
// (print-helper/print-helper.ps1) que roda no PC do caixa e repassa em modo
// RAW ao spooler do Windows. Esse caminho foi necessario porque a impressao
// grafica normal (window.print() -> driver) trava com 0 paginas nessa
// impressora (Knup KP-IM607, chipset generico), enquanto o modo RAW imprime
// corretamente. Vantagem sobre WebUSB: funciona em qualquer navegador e nao
// exige troca de driver (Zadig).
const PRINT_HELPER_URL = 'http://localhost:9100/print';
const PAPER_WIDTH_CHARS = 32;

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  customer: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod?: string;
}

const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function stripAccents(value: string) {
  return value.normalize('NFD').replace(COMBINING_DIACRITICS, '');
}

function padLine(left: string, right: string, width = PAPER_WIDTH_CHARS) {
  const l = stripAccents(left);
  const r = stripAccents(right);
  const gap = Math.max(1, width - l.length - r.length);
  return l.length + r.length + 1 > width ? `${l.slice(0, width - r.length - 1)} ${r}` : `${l}${' '.repeat(gap)}${r}`;
}

const ESC = 0x1b;
const GS = 0x1d;

class EscPosBuilder {
  private chunks: Uint8Array[] = [];

  private push(...bytes: number[]) {
    this.chunks.push(new Uint8Array(bytes));
    return this;
  }

  init() {
    return this.push(ESC, 0x40);
  }

  align(mode: 'left' | 'center' | 'right') {
    return this.push(ESC, 0x61, mode === 'center' ? 1 : mode === 'right' ? 2 : 0);
  }

  bold(on: boolean) {
    return this.push(ESC, 0x45, on ? 1 : 0);
  }

  doubleSize(on: boolean) {
    return this.push(GS, 0x21, on ? 0x11 : 0x00);
  }

  text(value: string) {
    this.chunks.push(new TextEncoder().encode(stripAccents(value)));
    return this;
  }

  line(value = '') {
    this.text(value);
    return this.push(0x0a);
  }

  divider() {
    return this.line('-'.repeat(PAPER_WIDTH_CHARS));
  }

  feedLines(lines: number) {
    for (let i = 0; i < lines; i++) this.push(0x0a);
    return this;
  }

  build(): Uint8Array {
    const size = this.chunks.reduce((acc, c) => acc + c.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

function buildReceiptEscPos({ customer, items, total, paymentMethod }: ReceiptData): Uint8Array {
  const now = new Date();
  const b = new EscPosBuilder();
  b.init();

  b.align('center');
  b.bold(true);
  b.line(BUSINESS_NAME);
  b.bold(false);
  b.line(`${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`);
  b.divider();

  b.align('left');
  b.bold(true);
  b.line(`Mesa/Cliente: ${customer}`);
  b.bold(false);
  b.divider();

  for (const item of items) {
    b.line(`${item.qty}x ${item.name}`);
    b.line(padLine(`  R$ ${item.unitPrice.toFixed(2)} un.`, `R$ ${item.total.toFixed(2)}`));
  }
  b.divider();

  b.doubleSize(true);
  b.bold(true);
  b.line(padLine('TOTAL', `R$ ${total.toFixed(2)}`, Math.floor(PAPER_WIDTH_CHARS / 2)));
  b.doubleSize(false);
  b.bold(false);
  if (paymentMethod) b.line(padLine('Pagamento', paymentMethod));
  b.divider();

  b.align('center');
  b.line('Obrigado pela preferencia!');
  b.feedLines(4);

  return b.build();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function sendToPrintHelper(bytes: Uint8Array) {
  const res = await fetch(PRINT_HELPER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: bytesToBase64(bytes) }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.error || `HTTP ${res.status}`);
  }
}

export async function printReceipt(data: ReceiptData) {
  try {
    const bytes = buildReceiptEscPos(data);
    await sendToPrintHelper(bytes);
  } catch (err) {
    console.error('Falha ao imprimir recibo:', err);
    toast.error('Não foi possível imprimir. O programa de impressão está aberto no PC do caixa?');
  }
}
