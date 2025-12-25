import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Building, ListChecks } from 'lucide-react';
import useDemands, { DemandDetail } from '@/hooks/use-demands';
import DemandCard from './DemandCard'; // Importando o card renomeado

interface Filters {
  block_id?: string;
  apartment_number?: string;
  service_type_id?: string;
  room_id?: string;
  status?: string;
}

interface DemandsByBlockViewerProps {
  filters: Filters;
}

const DemandsByBlockViewer: React.FC<DemandsByBlockViewerProps> = ({ filters }) => {
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

  // 1. Agrupar demandas por block_id
  const demandsGroupedByBlock = demands.reduce((acc, demand) => {
    const blockId = demand.block_id;
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(demand);
    return acc;
  }, {} as Record<string, DemandDetail[]>);

  // 2. Ordenar os blocos (opcional, mas bom para consistência)
  const sortedBlockIds = Object.keys(demandsGroupedByBlock).sort();

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ListChecks className="w-5 h-5 mr-2 text-primary" />
          Demandas Agrupadas por Bloco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedBlockIds.map((blockId) => {
            const blockDemands = demandsGroupedByBlock[blockId];
            const pendingCount = blockDemands.filter(d => d.status === 'Pendente').length;
            const totalCount = blockDemands.length;
            
            return (
              <AccordionItem key={blockId} value={blockId} className="border-b border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center font-semibold text-lg">
                    <Building className="w-5 h-5 mr-3 text-secondary-foreground" />
                    Bloco {blockId} ({totalCount} Demandas)
                    {pendingCount > 0 && (
                      <Badge variant="destructive" className="ml-3 bg-yellow-600 hover:bg-yellow-700">
                        {pendingCount} Pendentes
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {blockDemands.map(demand => (
                      <DemandCard key={demand.id} demand={demand} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DemandsByBlockViewer;