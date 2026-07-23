import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale } from '@/types/database';
import { parseNotes } from '@/lib/saleNotes';

const BUSINESS = 'Deus Proveu Espetos';
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface ExpenseLike {
  expense_date: string;
  amount: number;
  category: string | null;
  description: string;
}
interface ProductAgg {
  name: string;
  count: number;
  revenue: number;
  category: string;
}

export interface ReportPdfData {
  periodLabel: string;
  totals: { totalSales: number; totalExpenses: number; profit: number; salesCount: number };
  sales: Sale[];
  expenses: ExpenseLike[];
  products: ProductAgg[];
}

// Gera um relatório PDF completo e detalhado (A4, letra legível) para os donos
// consultarem fora do app. Usa o período já selecionado na tela de Relatórios.
export function generateReportPdf({ periodLabel, totals, sales, expenses, products }: ReportPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(BUSINESS, pageW / 2, 18, { align: 'center' });
  doc.setFontSize(13);
  doc.text('Relatório de Vendas e Custos', pageW / 2, 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Período: ${periodLabel}`, pageW / 2, 33, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageW / 2, 39, { align: 'center' });
  doc.setTextColor(0);

  // Resumo
  const margin_ = 44;
  const margem = totals.totalSales > 0 ? ((totals.profit / totals.totalSales) * 100).toFixed(1) : '0';
  autoTable(doc, {
    startY: margin_,
    head: [['Resumo do período', '']],
    body: [
      ['Vendas (bruto)', brl(totals.totalSales)],
      ['Custos', `- ${brl(totals.totalExpenses)}`],
      ['Lucro (líquido)', brl(totals.profit)],
      ['Margem de lucro', `${margem}%`],
      ['Nº de itens vendidos', String(totals.salesCount)],
    ],
    theme: 'grid',
    styles: { fontSize: 11, cellPadding: 2.5 },
    headStyles: { fillColor: [223, 166, 32], textColor: 30, fontSize: 12 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin, right: margin },
  });

  // Produtos vendidos
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Produtos vendidos', margin, y);
  const sortedProducts = [...products].sort(
    (a, b) => a.category.localeCompare(b.category) || b.revenue - a.revenue
  );
  autoTable(doc, {
    startY: y + 2,
    head: [['Categoria', 'Produto', 'Qtd', 'Receita']],
    body: sortedProducts.map((p) => [p.category, p.name, String(p.count), brl(p.revenue)]),
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  // Vendas detalhadas (por comanda: mesa + data/hora)
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Vendas detalhadas', margin, y);
  const sortedSales = [...sales].sort((a, b) => a.created_at.localeCompare(b.created_at));
  autoTable(doc, {
    startY: y + 2,
    head: [['Data/Hora', 'Mesa', 'Produto', 'Ponto / Obs.', 'Qtd', 'Valor', 'Pgto']],
    body: sortedSales.map((s) => {
      const { doneness, obs } = parseNotes(s.notes);
      const ponto = [doneness, obs].filter(Boolean).join(' · ') || '-';
      const pgto = s.payment_status === 'pago' ? s.payment_method || 'Pago' : 'Pendente';
      return [
        format(new Date(s.created_at), 'dd/MM HH:mm'),
        s.customer_name,
        s.product_name,
        ponto,
        String(Number(s.quantity)),
        brl(Number(s.total_price)),
        pgto,
      ];
    }),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 1.6 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  // Custos detalhados
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Custos detalhados', margin, y);
  const sortedExpenses = [...expenses].sort((a, b) => a.expense_date.localeCompare(b.expense_date));
  autoTable(doc, {
    startY: y + 2,
    head: [['Data', 'Categoria', 'Descrição', 'Valor']],
    body: sortedExpenses.length
      ? sortedExpenses.map((e) => [
          format(new Date(e.expense_date + 'T00:00:00'), 'dd/MM/yyyy'),
          e.category || '-',
          e.description,
          brl(Number(e.amount)),
        ])
      : [['-', '-', 'Nenhum custo no período', '-']],
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255 },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  // Rodapé com numeração
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `${BUSINESS}  •  página ${i} de ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const safe = periodLabel.replace(/[^\w-]+/g, '-');
  doc.save(`relatorio-${safe}.pdf`);
}
