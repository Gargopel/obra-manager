import React, { useState } from 'react';
import { DoorOpen, Filter, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OpeningsFilterPanel from '@/components/openings/OpeningsFilterPanel';
import OpeningsList from '@/components/openings/OpeningsList';
import CreateOpeningDialog from '@/components/openings/CreateOpeningDialog';
import useSiteConfig from '@/hooks/use-site-config';

const OpeningsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Aberturas';
    }
  }, [siteConfig]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <DoorOpen className="inline-block w-8 h-8 mr-2 text-primary" />
          Rastreamento de Aberturas
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
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
            Registrar Abertura
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <OpeningsFilterPanel onApplyFilters={setFilters} />
      )}

      <OpeningsList filters={filters} />

      <CreateOpeningDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default OpeningsPage;