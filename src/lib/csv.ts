export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${(cell ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
