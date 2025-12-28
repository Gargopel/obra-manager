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

/**
 * Gera um PDF com o manual detalhado das funcionalidades do sistema.
 */
export const exportManualToPdf = (siteName: string = 'Obra Manager') => {
  const doc = new jsPDF();
  let y = 20;

  const addText = (text: string, fontSize: number, isBold: boolean = false, spacing: number = 7) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, y);
    y += (lines.length * (fontSize * 0.5)) + spacing;
    
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Título Principal
  addText(`Manual do Usuário - ${siteName}`, 22, true, 10);
  addText('Guia completo de funcionalidades e operação do sistema.', 12, false, 15);

  // Seções baseadas no README
  addText('1. Dashboard Inteligente', 14, true, 5);
  addText('Painel central que consolida os indicadores da obra, como total de demandas, pendências, resolvidos e tempo médio. Inclui gráficos de análise por serviço, bloco e localização de pintura.', 11, false, 8);

  addText('2. Gestão de Demandas', 14, true, 5);
  addText('Controle de problemas identificados. Permite o cadastro em lote (vários aptos de uma vez), anexar fotos, e gerenciar pendências de empreiteiros terceirizados.', 11, false, 8);

  addText('3. Medição e Conferência', 14, true, 5);
  addText('Fluxo de qualidade onde usuários solicitam conferência de serviços executados. O conferente avalia como Concluído ou Inconcluído, registrando o que falta para aprovação.', 11, false, 8);

  addText('4. Rastreabilidade de Materiais', 14, true, 5);
  addText('Controle de lotes de cerâmica por localização e acompanhamento detalhado de pinturas (1ª e 2ª demãos) e instalação de aberturas/portas.', 11, false, 8);

  addText('5. Funcionários e Performance', 14, true, 5);
  addText('Designação de tarefas e ranking de qualidade. Ao finalizar uma tarefa, o funcionário é avaliado em Velocidade, Qualidade, Limpeza e Organização.', 11, false, 8);

  addText('6. Relatórios e Administração', 14, true, 5);
  addText('Exportação de dados em PDF baseada em filtros e configurações gerais de blocos, serviços, cômodos e personalização visual da obra.', 11, false, 8);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento gerado em ${format(new Date(), 'dd/MM/yyyy')}`, 14, 285);

  doc.save(`Manual_${siteName.replace(/\s+/g, '_')}.pdf`);
};