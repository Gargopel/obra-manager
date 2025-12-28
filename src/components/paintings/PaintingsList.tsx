import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, PaintBucket, User, Calendar, CheckCircle, Clock, Truck, Layers, Trash2 } from 'lucide-react';
import usePaintings, { PaintingDetail } from '@/hooks/use-paintings';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { PAINTING_STATUSES, PAINTING_COATS } from '@/utils/construction-structure';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';

interface PaintingsListProps {
  filters: any;
}

const getStatusColor = (status: PaintingDetail['status']) => {
  switch (status) {
    case 'Em Andamento': return 'bg-blue-500 hover:bg-blue-600';
    case 'Finalizado':
    case 'Entregue': return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: PaintingDetail['status']) => {
  switch (status) {
    case 'Em Andamento': return Clock;
    case 'Finalizado': return CheckCircle;
    case 'Entregue': return Truck;
    default: return Clock;
  }
};

export const PaintingCard: React.FC<{ painting: PaintingDetail }> = ({ painting }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const [currentStatus, setCurrentStatus] = React.useState(painting.status);
  const [currentCoat, setCurrentCoat] = React.useState(painting.coat);
  
  React.useEffect(() => {
    setCurrentStatus(painting.status);
    setCurrentCoat(painting.coat);
  }, [painting.status, painting.coat]);

  const updateMutation = useMutation({
    mutationFn: async ({ status, coat }: { status?: PaintingDetail['status'], coat?: PaintingDetail['coat'] }) => {
      const updateData: { status?: string, coat?: string, last_updated_at: string } = {
        last_updated_at: new Date().toISOString(),
      };
      if (status) updateData.status = status;
      if (coat) updateData.coat = coat;
      const { error } = await supabase.from('paintings').update(updateData).eq('id', painting.id);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      if (variables.status) showSuccess(`Status atualizado.`);
      if (variables.coat) showSuccess(`Demão atualizada.`);
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
    },
    onError: (error: any) => showError('Erro ao atualizar: ' + error.message),
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paintings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Registro excluído.');
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
    },
    onError: (error: any) => showError('Erro ao excluir: ' + error.message),
  });
  
  const StatusIcon = getStatusIcon(painting.status);
  const locationText = painting.apartment_number ? `Apto ${painting.apartment_number} - ${painting.location}` : painting.location;

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 transition-all hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" />Bloco {painting.block_id}</CardTitle>
          <Badge className={getStatusColor(painting.status)}><StatusIcon className="w-3 h-3 mr-1" />{painting.status}</Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1"><PaintBucket className="w-4 h-4 mr-1" />Local: {locationText}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary" className="flex items-center"><User className="w-3 h-3 mr-1" />{painting.painter_name}</Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50"><Layers className="w-3 h-3 mr-1" />{painting.coat}</Badge>
        </div>
        <div className="text-[10px] text-muted-foreground pt-2 border-t">
          <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Criado: {format(new Date(painting.created_at), 'dd/MM/yyyy HH:mm')}</div>
          <div className="flex items-center mt-1"><Clock className="w-3 h-3 mr-1" />Atualizado: {format(new Date(painting.last_updated_at), 'dd/MM/yyyy HH:mm')}</div>
        </div>
        <div className="pt-2 grid grid-cols-2 gap-2">
          <Select value={currentStatus} onValueChange={(val) => updateMutation.mutate({ status: val as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAINTING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={currentCoat} onValueChange={(val) => updateMutation.mutate({ coat: val as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAINTING_COATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => { if(window.confirm('Excluir?')) deleteMutation.mutate(painting.id); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PaintingsList: React.FC<PaintingsListProps> = ({ filters }) => {
  const { data: paintings, isLoading, error } = usePaintings(filters);
  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!paintings || paintings.length === 0) return <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground">Nenhuma pintura encontrada.</div>;
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {paintings.map(p => <PaintingCard key={p.id} painting={p} />)}
    </div>
  );
};

export default PaintingsList;