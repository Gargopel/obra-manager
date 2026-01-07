import React, { useState } from 'react';
import { ListChecks, Filter, PlusCircle, LayoutGrid, List, Loader2, FileText, ClipboardList, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DemandsFilterPanel from '@/components/demands/DemandsFilterPanel';
import DemandCard from '@/components/demands/DemandCard';
import CreateDemandDialog from '@/components/demands/CreateDemandDialog';
import CreateApartmentDemandsDialog from '@/components/demands/CreateApartmentDemandsDialog';
import useSiteConfig from '@/hooks/use-site-config';
import useDemands, { DemandDetail } from '@/hooks/use-demands';
import DemandsByBlockViewer from '@/components/demands/DemandsByBlockViewer';
import { Badge } from '@/components/ui/badge';
import { exportToPdf } from '@/utils/pdf-export';

const SimpleDemandsList: React.FC<{ demands: DemandDetail[], isLoading: boolean, error: Error | null }> = ({ demands, isLoading, error }) => {
  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-red-500">Erro ao carregar demandas: {error.message}</div>;
  if (!demands || demands.length === 0) return <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">Nenhuma demanda encontrada com os filtros aplicados.</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">{demands.length}</Badge>
        demandas encontradas
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {demands.map(demand => <DemandCard key={demand.id} demand={demand} />)}
      </div>
    </div>
  );
};

const DemandsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAptCreateOpen, setIsAptCreateOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  const { data: demands, isLoading, error } = useDemands(filters);
  
  React.useEffect(() => {
    if (siteConfig?.site_name) document.title = siteConfig.site_name + ' - Demandas';
  }, [siteConfig]);

  const handleExportPdf = () => {
    if (!demands || demands.length === 0) return;
    
    const columns = ['Bloco', 'Apto', 'Serviço', 'Cômodo', 'Status', 'Empreiteiro', 'Descrição'];
    const rows = demands.map(d => [
      d.block_id,
      d.apartment_number,
      d.service_type_name,
      d.room_name,
      d.status,
      d.contractor_name || '-',
      d.description || '-'
    ]);

    exportToPdf({
      title: 'Relatório de Demandas',
      filename: 'demandas',
      columns,
      rows,
      siteName: siteConfig?.site_name
    });
  };

  const handleExportChecklistPdf = () => {
    if (!demands || demands.length === 0) return;
    
    // Formato de Checklist focado em execução de campo
    const columns = ['', 'Bloco', 'Apto', 'Serviço', 'Cômodo', 'Descrição', 'Assinatura'];
    const rows = demands.map(d => [
      '[  ]', // Coluna de Checkbox
      d.block_id,
      d.apartment_number,
      d.service_type_name,
      d.room_name,
      d.description || '-',
      '________________' // Espaço para assinatura/rubrica
    ]);

    exportToPdf({
      title: 'Checklist de Execução de Demandas',
      filename: 'checklist_demandas',
      columns,
      rows,
      siteName: siteConfig?.site_name
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <ListChecks className="inline-block w-8 h-8 mr-2 text-primary" />
          Gerenciamento de Demandas
        </h1>
        
        {/* Container de Botões com Wrap Melhorado */}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          {/* Grupo de PDF */}
          <div className="flex bg-background/50 backdrop-blur-sm p-1 rounded-lg border border-border shadow-sm">
            <Button variant="ghost" size="sm" onClick={handleExportPdf} disabled={!demands || demands.length === 0} className="h-8">
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportChecklistPdf} disabled={!demands || demands.length === 0} className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <CheckSquare className="w-4 h-4 mr-2" /> PDF Checklist
            </Button>
          </div>

          <Button variant="outline" onClick={() => setIsGroupedView(!isGroupedView)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            {isGroupedView ? <><List className="w-4 h-4 mr-2" /> Lista</> : <><LayoutGrid className="w-4 h-4 mr-2" /> Blocos</>}
          </Button>

          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          
          <Button variant="secondary" onClick={() => setIsAptCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <ClipboardList className="w-4 h-4 mr-2" /> Checklist Apto
          </Button>

          <Button onClick={() => setIsCreateOpen(true)}><PlusCircle className="w-4 h-4 mr-2" /> Nova Demanda</Button>
        </div>
      </div>

      {isFilterOpen && <DemandsFilterPanel onApplyFilters={setFilters} />}

      {isGroupedView ? (
        <DemandsByBlockViewer filters={filters} />
      ) : (
        <SimpleDemandsList demands={demands || []} isLoading={isLoading} error={error} />
      )}

      <CreateDemandDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <CreateApartmentDemandsDialog open={isAptCreateOpen} onOpenChange={setIsAptCreateOpen} />
    </div>
  );
};

export default DemandsPage;