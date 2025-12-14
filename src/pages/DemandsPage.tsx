import React, { useState } from 'react';
import { ListChecks, Filter, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DemandsFilterPanel from '@/components/demands/DemandsFilterPanel';
import DemandsList from '@/components/demands/DemandsList';
import CreateDemandDialog from '@/components/demands/CreateDemandDialog';

const DemandsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState({});

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
          <ListChecks className="inline-block w-8 h-8 mr-2 text-primary" />
          Gerenciamento de Demandas
        </h1>
        <div className="flex space-x-4">
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

      <DemandsList filters={filters} />

      <CreateDemandDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default DemandsPage;