import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BrickWall, Calendar, Package } from 'lucide-react';
import useCeramicLots from '@/hooks/use-ceramic-lots';
import { format } from 'date-fns';

interface CeramicLotViewerProps {
  blockId: string; // ID do bloco (UUID)
  blockName: string; // Nome do bloco (A, B, C...)
}

const CeramicLotViewer: React.FC<CeramicLotViewerProps> = ({ blockId, blockName }) => {
  const { data: lots, isLoading, error } = useCeramicLots(blockId);

  if (isLoading) {
    return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">Erro ao carregar lotes: {error.message}</div>;
  }

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <BrickWall className="w-5 h-5 mr-2 text-primary" /> 
          Lotes de Cerâmica - Bloco {blockName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Lote</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead className="w-[120px]">Data Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots && lots.length > 0 ? (
                lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium flex items-center">
                      <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                      {lot.lot_number}
                    </TableCell>
                    <TableCell>{lot.product_name || 'N/A'}</TableCell>
                    <TableCell>{lot.manufacturer || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {lot.purchase_date ? format(new Date(lot.purchase_date), 'dd/MM/yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum lote de cerâmica cadastrado para este bloco.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CeramicLotViewer;