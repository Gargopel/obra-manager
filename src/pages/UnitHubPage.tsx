import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, ListChecks, PaintBucket, BrickWall, ArrowLeft, Loader2, MapPin, Construction } from 'lucide-react';
import useDemands from '@/hooks/use-demands';
import usePaintings from '@/hooks/use-paintings';
import useCeramicLots from '@/hooks/use-ceramic-lots';
import DemandCard from '@/components/demands/DemandCard';
import { PaintingCard } from '@/components/paintings/PaintingsList';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UnitHubPage: React.FC = () => {
  const { blockId, unitId } = useParams<{ blockId: string; unitId: string }>();
  const navigate = useNavigate();

  // 1. Carregar Demandas da Unidade
  const { data: demands, isLoading: isLoadingDemands } = useDemands({ 
    block_id: blockId, 
    apartment_number: unitId 
  });

  // 2. Carregar Pinturas da Unidade
  const { data: paintings, isLoading: isLoadingPaintings } = usePaintings({ 
    block_id: blockId, 
    apartment_number: unitId 
  });

  // 3. Carregar Cerâmicas da Unidade (O hook usa block_id, filtramos o apt no frontend)
  const { data: ceramicLots, isLoading: isLoadingCeramics } = useCeramicLots(blockId);
  const unitCeramics = ceramicLots?.filter(lot => lot.apartment_number === unitId) || [];

  const isLoading = isLoadingDemands || isLoadingPaintings || isLoadingCeramics;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Sincronizando dados da unidade...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Fixo de Navegação */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md p-2 rounded-lg border shadow-sm">
        <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Construction className="w-4 h-4 text-primary" />
          <span className="font-black text-sm uppercase">Modo Inspeção de Campo</span>
        </div>
      </div>

      {/* Hero da Unidade */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Home className="w-40 h-40" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
             <MapPin className="w-5 h-5 text-blue-300" />
             <span className="text-blue-200 font-bold uppercase tracking-widest text-xs">Localização Localizada</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Bloco {blockId}</h1>
          <h2 className="text-3xl font-light">Apartamento {unitId}</h2>
          <div className="flex gap-2 pt-4">
             <Badge className="bg-white/20 text-white border-0">{demands?.length || 0} Demandas</Badge>
             <Badge className="bg-white/20 text-white border-0">{paintings?.length || 0} Pinturas</Badge>
          </div>
        </div>
      </div>

      {/* Seção 1: Demandas */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <ListChecks className="w-6 h-6 text-primary" /> Demandas Pendentes/Resolvidas
        </h3>
        {demands && demands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demands.map(d => <DemandCard key={d.id} demand={d} />)}
          </div>
        ) : (
          <Card className="border-dashed bg-accent/5"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma demanda registrada para esta unidade.</CardContent></Card>
        )}
      </section>

      {/* Seção 2: Pinturas */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <PaintBucket className="w-6 h-6 text-primary" /> Rastreamento de Pintura
        </h3>
        {paintings && paintings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paintings.map(p => <PaintingCard key={p.id} painting={p} />)}
          </div>
        ) : (
          <Card className="border-dashed bg-accent/5"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma pintura registrada ainda.</CardContent></Card>
        )}
      </section>

      {/* Seção 3: Cerâmicas */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <BrickWall className="w-6 h-6 text-primary" /> Lotes de Cerâmica Aplicados
        </h3>
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
          <CardContent className="p-0">
            {unitCeramics.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Nº Lote</TableHead>
                    <TableHead>Produto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitCeramics.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-bold text-xs">{lot.location}</TableCell>
                      <TableCell className="font-mono text-blue-600 font-bold">{lot.lot_number}</TableCell>
                      <TableCell className="text-xs">{lot.product_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">Informação de lote não cadastrada.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default UnitHubPage;