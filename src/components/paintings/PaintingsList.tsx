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
import { useSession } from '@/contexts/SessionContext'; // Importando useSession

interface PaintingsListProps {
  filters: any;
}

const getStatusColor = (status: PaintingDetail['status']) => {
  switch (status) {
    case 'Em Andamento':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'Finalizado':
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
      
      const { error } = await supabase
        .from('paintings')
        .update(updateData)
        .eq('id', painting.id);
        
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      if (variables.status) showSuccess(`Status atualizado para ${variables.status}.`);
      if (variables.coat) showSuccess(`Demão atualizada para ${variables.coat}.`);
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar: ' + error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('paintings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Registro de pintura excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error) => {
      showError('Erro ao excluir registro: ' + error.message);
    },
  });
  
  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este registro de pintura permanentemente?')) {
      deleteMutation.mutate(painting.id);
    }
  };
  
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
          <Badge variant="secondary" className="flex items-center bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Layers className="w-3 h-3 mr-1" />
            Demão: {painting.coat}
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
        
        {/* Atualização de Status e Demão */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mudar Status */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Status:</Label>
            <Select 
              value={currentStatus} 
              onValueChange={(val) => {
                setCurrentStatus(val as PaintingDetail['status']);
                updateMutation.mutate({ status: val as PaintingDetail['status'] });
              }}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {PAINTING_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Mudar Demão */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Demão:</Label>
            <Select 
              value={currentCoat} 
              onValueChange={(val) => {
                setCurrentCoat(val as PaintingDetail['coat']);
                updateMutation.mutate({ coat: val as PaintingDetail['coat'] });
              }}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Demão" />
              </SelectTrigger>
              <SelectContent>
                {PAINTING_COATS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          {isAdmin && (
            <Button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
              size="sm"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir
            </Button>
          )}
        </div>
        
        {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />}
        
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