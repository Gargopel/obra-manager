import React, { useState } from 'react';
import { PaintBucket, Filter, PlusCircle, LayoutGrid, List, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaintingsFilterPanel from '@/components/paintings/PaintingsFilterPanel';
import PaintingsList from '@/components/paintings/PaintingsList';
import PaintingsByBlockViewer from '@/components/paintings/PaintingsByBlockViewer';
import CreatePaintingDialog from '@/components/paintings/CreatePaintingDialog';
import useSiteConfig from '@/hooks/use-site-config';
import usePaintings from '@/hooks/use-paintings';
import { exportToPdf } from '@/utils/pdf-export';

const PaintingsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  const { data: paintings } = usePaintings(filters);
  
  React.useEffect(() => {
    if (siteConfig?.site_name) document.title = siteConfig.site_name + ' - Pinturas';
  }, [siteConfig]);

  const handleExportPdf = () => {
    if (!paintings || paintings.length === 0) return;
    
    const columns = ['Bloco', 'Local/Apto', 'Pintor', 'Demão', 'Status', 'Última Atualização'];
    const rows = paintings.map(p => [
      p.block_id,
      p.apartment_number ? `Apto ${p.apartment_number}` : p.location,
      p.painter_name,
      p.coat,
      p.status,
      new Date(p.last_updated_at).toLocaleDateString('pt-BR')
    ]);

    exportToPdf({
      title: 'Relatório de Pinturas',
      filename: 'pinturas',
      columns,
      rows,
      siteName: siteConfig?.site_name
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <PaintBucket className="inline-block w-8 h-8 mr-2 text-primary" />
          Rastreamento de Pinturas
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
          <Button variant="outline" onClick={handleExportPdf} disabled={!paintings || paintings.length === 0} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => setIsGroupedView(!isGroupedView)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            {isGroupedView ? <><List className="w-4 h-4 mr-2" /> Lista</> : <><LayoutGrid className="w-4 h-4 mr-2" /> Blocos</>}
          </Button>
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}><PlusCircle className="w-4 h-4 mr-2" /> Registrar Pintura</Button>
        </div>
      </div>

      {isFilterOpen && <PaintingsFilterPanel onApplyFilters={setFilters} />}
      {isGroupedView ? <PaintingsByBlockViewer filters={filters} /> : <PaintingsList filters={filters} />}
      <CreatePaintingDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default PaintingsPage;