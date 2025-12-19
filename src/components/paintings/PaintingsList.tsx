import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, PaintBucket, User, Calendar, CheckCircle, Clock, Truck } from 'lucide-react';
import usePaintings, { PaintingDetail } from '@/hooks/use-paintings';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { PAINTING_STATUSES } from '@/utils/construction-structure';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PaintingsListProps {
  filters: any;
}

const getStatusColor = (status: PaintingDetail['status']) => {
  switch (status) {
    case 'Em Andamento':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'Finalizado':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'Entregue':
      return 'bg-green-500 hover:bg-green-600';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: PaintingDetail['status']) => {
  switch (status) {
    case 'Em Andamento':
      return Clock;
    case 'Finalizado':
      return CheckCircle;
    case 'Entregue':
      return Truck;
    default:
      return Clock;
  }
};

const PaintingCard: React.FC<{ painting: PaintingDetail }> = ({ painting }) => {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = React.useState(painting.status);
  
  React.useEffect(() => {
    setCurrentStatus(painting.status);
  }, [painting.status]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: PaintingDetail['status']) => {
      const { error } = await supabase
        .from('paintings')
        .update({ 
          status: newStatus,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', painting.id);
        
      if (error) throw error;
    },
    onSuccess: (data, newStatus) => {
      showSuccess(`Status atualizado para ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar status: ' + error.message);
    },
  });
  
  const StatusIcon = getStatusIcon(painting.status);
  const statusColor = getStatusColor(painting.status);
  
  const locationText = painting.apartment_number 
    ? `Apto ${painting.apartment_number} - ${painting.location}`
    : painting.location;

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Bloco {painting.block_id}
          </CardTitle>
          <Badge className={statusColor}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {painting.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1">
          <PaintBucket className="w-4 h-4 mr-1" />
          Local: {locationText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary" className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            Pintor: {painting.painter_name}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Criado em: {format(new Date(painting.created_at), 'dd/MM/yyyy HH:mm')}
          </div>
          <div className="flex items-center mt-1">
            <Clock className="w-3 h-3 mr-1" />
            Última Atualização: {format(new Date(painting.last_updated_at), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        {/* Atualização de Status */}
        <div className="pt-2 flex items-center space-x-2">
          <Label className="text-sm font-medium whitespace-nowrap">Mudar Status:</Label>
          <Select 
            value={currentStatus} 
            onValueChange={(val) => {
              setCurrentStatus(val as PaintingDetail['status']);
              updateStatusMutation.mutate(val as PaintingDetail['status']);
            }}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PAINTING_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
        
      </CardContent>
    </Card>
  );
};

const PaintingsList: React.FC<PaintingsListProps> = ({ filters }) => {
  const { data: paintings, isLoading, error } = usePaintings(filters);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Erro ao carregar pinturas: {error.message}</div>;
  }
  
  if (!paintings || paintings.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
        Nenhum serviço de pintura encontrado com os filtros aplicados.
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {paintings.map(painting => (
        <PaintingCard key={painting.id} painting={painting} />
      ))}
    </div>
  );
};

export default PaintingsList;