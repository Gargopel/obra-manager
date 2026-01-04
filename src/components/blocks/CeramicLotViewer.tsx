import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BrickWall, MapPin, Package, StickyNote } from 'lucide-react';
import useCeramicLots from '@/hooks/use-ceramic-lots';
import { Badge } from '@/components/ui/badge';

interface CeramicLotViewerProps {
  blockId: string;
  blockName: string;
}

const CeramicLotViewer: React.FC<CeramicLotViewerProps> = ({ blockId, blockName }) => {
  const { data: lots, isLoading, error } = useCeramicLots(blockId);

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <div className="text-red-500 p-6">Erro ao carregar lotes.</div>;

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-lg flex items-center">
          <BrickWall className="w-5 h-5 mr-2 text-primary" /> 
          Lotes de Cerâmica - Bloco {blockName}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border bg-white/50 dark:bg-gray-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Localização</TableHead>
                <TableHead>Nº Lote</TableHead>
                <TableHead>Modelo/Produto</TableHead>
                <TableHead className="hidden md:table-cell">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots && lots.length > 0 ? (
                lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm font-bold">
                          <MapPin className="w-3 h-3 mr-1 text-primary" />
                          {lot.apartment_number || `${lot.floor_number}º Andar`}
                        </div>
                        <Badge variant="secondary" className="w-fit text-[10px] uppercase">
                          {lot.location}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                      <div className="flex items-center">
                        <Package className="w-3 h-3 mr-1 opacity-50" />
                        {lot.lot_number}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{lot.product_name || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground italic">
                      {lot.notes ? (
                        <div className="flex items-start">
                          <StickyNote className="w-3 h-3 mr-1 mt-0.5" />
                          {lot.notes}
                        </div>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground p-8">Nenhum lote registrado para este bloco.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CeramicLotViewer;