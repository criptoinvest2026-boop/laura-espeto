const BUSINESS_NAME = 'Top Espetos';

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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function buildReceiptHtml({ customer, items, total, paymentMethod }: ReceiptData) {
  const now = new Date();
  const itemsHtml = items
    .map(
      (item) => `
        <div class="line">
          <span>${item.qty}x ${escapeHtml(item.name)}</span>
        </div>
        <div class="line sub">
          <span>R$ ${item.unitPrice.toFixed(2)} un.</span>
          <span>R$ ${item.total.toFixed(2)}</span>
        </div>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Recibo</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  body {
    width: 58mm;
    margin: 0;
    padding: 2mm 3mm;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .line { display: flex; justify-content: space-between; }
  .line.sub { color: #333; }
  .totals { margin-top: 4px; }
  .totals .line { font-size: 13px; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:14px;">${escapeHtml(BUSINESS_NAME)}</div>
  <div class="center">${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</div>
  <div class="divider"></div>
  <div class="bold">Mesa/Cliente: ${escapeHtml(customer)}</div>
  <div class="divider"></div>
  ${itemsHtml}
  <div class="divider"></div>
  <div class="totals">
    <div class="line bold">
      <span>TOTAL</span>
      <span>R$ ${total.toFixed(2)}</span>
    </div>
    ${paymentMethod ? `<div class="line"><span>Pagamento</span><span>${escapeHtml(paymentMethod)}</span></div>` : ''}
  </div>
  <div class="divider"></div>
  <div class="center">Obrigado pela preferência!</div>
</body>
</html>`;
}

export function printReceipt(data: ReceiptData) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  doc.open();
  doc.write(buildReceiptHtml(data));
  doc.close();

  iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 200);
  setTimeout(cleanup, 5000);
}
