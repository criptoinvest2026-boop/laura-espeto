import { toast } from 'sonner';

const BUSINESS_NAME = 'Top Espetos';

// Generic ESC/POS 58mm thermal printer chipset (identified via Windows registry
// for this specific Knup KP-IM607 unit). Windows print-spooler based printing
// (window.print() to the installed driver) was tested and reliably hangs with
// 0 pages printed on this hardware, so we talk to the raw USB interface
// directly instead, bypassing the OS print queue entirely.
const PRINTER_VENDOR_ID = 0x6868;
const PRINTER_PRODUCT_ID = 0x0200;
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
  b.doubleSize(true);
  b.bold(true);
  b.line(BUSINESS_NAME);
  b.doubleSize(false);
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

// WebUSB (navigator.usb) has no lib.dom.d.ts types in this project's TS setup;
// typed loosely as `any` rather than pulling in a dedicated @types package.
let cachedDevice: any | null = null;

async function getPrinterDevice(): Promise<any> {
  const usb = (navigator as any).usb;
  if (!usb) throw new Error('WebUSB não suportado neste navegador (use Chrome ou Edge).');

  if (cachedDevice) return cachedDevice;

  const known = await usb.getDevices();
  let device = known.find((d) => d.vendorId === PRINTER_VENDOR_ID && d.productId === PRINTER_PRODUCT_ID);

  if (!device) {
    device = await usb.requestDevice({
      filters: [{ vendorId: PRINTER_VENDOR_ID, productId: PRINTER_PRODUCT_ID }],
    });
  }

  cachedDevice = device;
  return device;
}

async function sendRawToPrinter(bytes: Uint8Array) {
  const device = await getPrinterDevice();

  if (!device.opened) await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);

  const iface = device.configuration!.interfaces[0];
  if (!iface.claimed) await device.claimInterface(iface.interfaceNumber);

  const endpoint = iface.alternate.endpoints.find((e) => e.direction === 'out');
  if (!endpoint) throw new Error('Endpoint de saída não encontrado na impressora.');

  await device.transferOut(endpoint.endpointNumber, bytes);
}

export async function printReceipt(data: ReceiptData) {
  try {
    const bytes = buildReceiptEscPos(data);
    await sendRawToPrinter(bytes);
  } catch (err) {
    console.error('Falha ao imprimir recibo via USB:', err);
    toast.error('Falha ao imprimir recibo. Verifique a conexão USB da impressora.');
  }
}
