import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Building, PaintBucket } from 'lucide-react';
import usePaintings, { PaintingDetail } from '@/hooks/use-paintings';
import { PaintingCard } from './PaintingsList';
import { Badge } from '@/components/ui/badge';

interface PaintingsByBlockViewerProps {
  filters: any;
}

const PaintingsByBlockViewer: React.FC<PaintingsByBlockViewerProps> = ({ filters }) => {
  const { data: paintings, isLoading, error } = usePaintings(filters);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !paintings || paintings.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
        Nenhum serviço de pintura encontrado.
      </div>
    );
  }

  const grouped = paintings.reduce((acc, p) => {
    if (!acc[p.block_id]) acc[p.block_id] = [];
    acc[p.block_id].push(p);
    return acc;
  }, {} as Record<string, PaintingDetail[]>);

  const sortedBlocks = Object.keys(grouped).sort();

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
      <CardHeader><CardTitle className="text-xl flex items-center"><PaintBucket className="w-5 h-5 mr-2" /> Pinturas por Bloco</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedBlocks.map(blockId => {
            const blockItems = grouped[blockId];
            const inProgress = blockItems.filter(i => i.status === 'Em Andamento').length;
            return (
              <AccordionItem key={blockId} value={blockId} className="border-b border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center font-semibold text-lg">
                    <Building className="w-5 h-5 mr-3" />
                    Bloco {blockId} ({blockItems.length} Registros)
                    {inProgress > 0 && <Badge className="ml-3 bg-blue-600">{inProgress} Em Andamento</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {blockItems.map(p => <PaintingCard key={p.id} painting={p} />)}
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

export default PaintingsByBlockViewer;