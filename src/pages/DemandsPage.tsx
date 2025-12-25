import React, { useState } from 'react';
import { ListChecks, Filter, PlusCircle, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DemandsFilterPanel from '@/components/demands/DemandsFilterPanel';
import DemandCard from '@/components/demands/DemandCard'; // Importando o card renomeado
import CreateDemandDialog from '@/components/demands/CreateDemandDialog';
import useSiteConfig from '@/hooks/use-site-config';
import useDemands, { DemandDetail } from '@/hooks/use-demands'; // Importando useDemands para a lista simples
import { Loader2 } from '@/components/ui/loader'; // Importando Loader2
import DemandsByBlockViewer from '@/components/demands/DemandsByBlockViewer'; // Importando o novo viewer

const SimpleDemandsList: React.FC<{ filters: any }> = ({ filters }) => {
  const { data: demands, isLoading, error } = useDemands(filters);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Erro ao carregar demandas: {error.message}</div>;
  }
  
  if (!demands || demands.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
        Nenhuma demanda encontrada com os filtros aplicados.
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {demands.map(demand => (
        <DemandCard key={demand.id} demand={demand} />
      ))}
    </div>
  );
};


const DemandsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false); // Novo estado para visualização agrupada
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Demandas';
    }
  }, [siteConfig]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <ListChecks className="inline-block w-8 h-8 mr-2 text-primary" />
          Gerenciamento de Demandas
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
          
          {/* Botão de Alternância de Visualização */}
          <Button 
            variant="outline" 
            onClick={() => setIsGroupedView(!isGroupedView)}
            className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50"
          >
            {isGroupedView ? (
              <>
                <List className="w-4 h-4 mr-2" />
                Ver em Lista
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Agrupar por Bloco
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Demanda
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <DemandsFilterPanel onApplyFilters={setFilters} />
      )}

      {isGroupedView ? (
        <DemandsByBlockViewer filters={filters} />
      ) : (
        <SimpleDemandsList filters={filters} />
      )}

      <CreateDemandDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default DemandsPage;