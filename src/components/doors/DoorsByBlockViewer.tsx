import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Building, DoorClosed } from 'lucide-react';
import useDoors, { DoorDetail } from '@/hooks/use-doors';
import { DoorCard } from './DoorsList';
import { Badge } from '@/components/ui/badge';

interface DoorsByBlockViewerProps {
  filters: any;
}

const DoorsByBlockViewer: React.FC<DoorsByBlockViewerProps> = ({ filters }) => {
  const { data: doors, isLoading, error } = useDoors(filters);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !doors || doors.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
        Nenhuma porta encontrada.
      </div>
    );
  }

  const grouped = doors.reduce((acc, d) => {
    if (!acc[d.block_id]) acc[d.block_id] = [];
    acc[d.block_id].push(d);
    return acc;
  }, {} as Record<string, DoorDetail[]>);

  const sortedBlocks = Object.keys(grouped).sort();

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
      <CardHeader><CardTitle className="text-xl flex items-center"><DoorClosed className="w-5 h-5 mr-2" /> Portas por Bloco</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedBlocks.map(blockId => {
            const blockItems = grouped[blockId];
            const missing = blockItems.filter(i => i.status === 'Falta').length;
            return (
              <AccordionItem key={blockId} value={blockId} className="border-b border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center font-semibold text-lg">
                    <Building className="w-5 h-5 mr-3" />
                    Bloco {blockId} ({blockItems.length} Portas)
                    {missing > 0 && <Badge variant="destructive" className="ml-3">{missing} Faltando</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {blockItems.map(d => <DoorCard key={d.id} door={d} />)}
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

export default DoorsByBlockViewer;