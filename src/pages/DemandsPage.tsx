import React, { useState } from 'react';
import { ListChecks, Filter, PlusCircle, LayoutGrid, List, Loader2, FileText, ClipboardList } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <ListChecks className="inline-block w-8 h-8 mr-2 text-primary" />
          Gerenciamento de Demandas
        </h1>
        <div className="flex space-x-2 sm:space-x-4 flex-shrink-0 flex-wrap gap-y-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={!demands || demands.length === 0} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
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
      
      {/* Novo Diálogo de Checklist por Apartamento */}
      <CreateApartmentDemandsDialog open={isAptCreateOpen} onOpenChange={setIsAptCreateOpen} />
    </div>
  );
};

export default DemandsPage;