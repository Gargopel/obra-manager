import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportPdfOptions {
  title: string;
  filename: string;
  columns: string[];
  rows: any[][];
  siteName?: string;
}

export const exportToPdf = ({ title, filename, columns, rows, siteName }: ExportPdfOptions) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

  // Cabeçalho
  doc.setFontSize(18);
  doc.text(siteName || 'Obra Manager', 14, 15);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 14, 22);
  
  doc.setFontSize(8);
  doc.text(`Gerado em: ${dateStr}`, 14, 27);

  // Tabela
  autoTable(doc, {
    startY: 32,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { top: 30 },
  });

  doc.save(`${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};