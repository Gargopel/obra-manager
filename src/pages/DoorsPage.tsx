import React, { useState } from 'react';
import { DoorClosed, Filter, PlusCircle, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DoorsFilterPanel from '@/components/doors/DoorsFilterPanel';
import DoorsList from '@/components/doors/DoorsList';
import DoorsByBlockViewer from '@/components/doors/DoorsByBlockViewer';
import CreateDoorDialog from '@/components/doors/CreateDoorDialog';
import useSiteConfig from '@/hooks/use-site-config';

const DoorsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Portas';
    }
  }, [siteConfig]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <DoorClosed className="inline-block w-8 h-8 mr-2 text-primary" />
          Rastreamento de Portas
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
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