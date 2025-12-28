import React, { useState } from 'react';
import { DoorClosed, Filter, PlusCircle, LayoutGrid, List, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DoorsFilterPanel from '@/components/doors/DoorsFilterPanel';
import DoorsList from '@/components/doors/DoorsList';
import DoorsByBlockViewer from '@/components/doors/DoorsByBlockViewer';
import CreateDoorDialog from '@/components/doors/CreateDoorDialog';
import useSiteConfig from '@/hooks/use-site-config';
import useDoors from '@/hooks/use-doors';
import { exportToPdf } from '@/utils/pdf-export';

const DoorsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  const { data: doors } = useDoors(filters);
  
  React.useEffect(() => {
    if (siteConfig?.site_name) document.title = siteConfig.site_name + ' - Portas';
  }, [siteConfig]);

  const handleExportPdf = () => {
    if (!doors || doors.length === 0) return;
    
    const columns = ['Bloco', 'Apto', 'Andar', 'Tipo', 'Status', 'Última Atualização'];
    const rows = doors.map(d => [
      d.block_id,
      d.apartment_number,
      `${d.floor_number}º`,
      d.door_type_name,
      d.status,
      new Date(d.last_updated_at).toLocaleDateString('pt-BR')
    ]);

    exportToPdf({
      title: 'Relatório de Instalação de Portas',
      filename: 'portas',
      columns,
      rows,
      siteName: siteConfig?.site_name
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <DoorClosed className="inline-block w-8 h-8 mr-2 text-primary" />
          Rastreamento de Portas
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
          <Button variant="outline" onClick={handleExportPdf} disabled={!doors || doors.length === 0} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => setIsGroupedView(!isGroupedView)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            {isGroupedView ? <><List className="w-4 h-4 mr-2" /> Lista</> : <><LayoutGrid className="w-4 h-4 mr-2" /> Blocos</>}
          </Button>
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}><PlusCircle className="w-4 h-4 mr-2" /> Registrar Porta</Button>
        </div>
      </div>

      {isFilterOpen && <DoorsFilterPanel onApplyFilters={setFilters} />}
      {isGroupedView ? <DoorsByBlockViewer filters={filters} /> : <DoorsList filters={filters} />}
      <CreateDoorDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default DoorsPage;