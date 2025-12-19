import React from 'react';
import { Building, BrickWall, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import useConfigData from '@/hooks/use-config-data';
import { Loader2 } from 'lucide-react';
import CeramicLotViewer from '@/components/blocks/CeramicLotViewer';

const BlocksPage: React.FC = () => {
  const { data: configData, isLoading, error } = useConfigData();

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-10">Erro ao carregar a lista de blocos: {error.message}</div>;
  }
  
  const blocks = configData?.blocks || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
        <Building className="inline-block w-8 h-8 mr-2 text-primary" />
        Rastreabilidade de Blocos
      </h1>

      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-xl">Lotes de Cerâmica por Bloco</CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">Nenhum bloco cadastrado no sistema.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {blocks.map((block) => (
                <AccordionItem key={block.id} value={block.id} className="border-b border-border/50">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center font-semibold text-lg">
                      <Building className="w-5 h-5 mr-3 text-secondary-foreground" />
                      Bloco {block.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <CeramicLotViewer blockId={block.id} blockName={block.name} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlocksPage;