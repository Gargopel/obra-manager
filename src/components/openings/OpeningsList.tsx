import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, DoorOpen, Calendar, CheckCircle, Clock, Truck, Trash2 } from 'lucide-react';
import useOpenings, { OpeningDetail } from '@/hooks/use-openings';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';

interface OpeningsListProps {
  filters: any;
}

const getStatusColor = (status: OpeningDetail['status']) => {
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

const getStatusIcon = (status: OpeningDetail['status']) => {
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

const OpeningCard: React.FC<{ opening: OpeningDetail }> = ({ opening }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const [currentStatus, setCurrentStatus] = React.useState(opening.status);
  
  React.useEffect(() => {
    setCurrentStatus(opening.status);
  }, [opening.status]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: OpeningDetail['status']) => {
      const { error } = await supabase
        .from('openings')
        .update({ 
          status: newStatus,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', opening.id);
        
      if (error) throw error;
    },
    onSuccess: (data, newStatus) => {
      showSuccess(`Status atualizado para ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['openings'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar status: ' + error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('openings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Registro de abertura excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['openings'] });
    },
    onError: (error) => {
      showError('Erro ao excluir registro: ' + error.message);
    },
  });
  
  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este registro de abertura permanentemente?')) {
      deleteMutation.mutate(opening.id);
    }
  };
  
  const StatusIcon = getStatusIcon(opening.status);
  const statusColor = getStatusColor(opening.status);
  
  const locationText = opening.apartment_number 
    ? `Apto ${opening.apartment_number}`
    : opening.floor_number 
      ? `${opening.floor_number}º Andar`
      : 'Local não especificado';

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Bloco {opening.block_id}
          </CardTitle>
          <Badge className={statusColor}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {opening.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1">
          <DoorOpen className="w-4 h-4 mr-1" />
          Local: {locationText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary" className="flex items-center">
            <DoorOpen className="w-3 h-3 mr-1" />
            Tipo: {opening.opening_type_name}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Criado em: {format(new Date(opening.created_at), 'dd/MM/yyyy HH:mm')}
          </div>
          <div className="flex items-center mt-1">
            <Clock className="w-3 h-3 mr-1" />
            Última Atualização: {format(new Date(opening.last_updated_at), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        {/* Atualização de Status e Exclusão */}
        <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium whitespace-nowrap">Mudar Status:</Label>
            <Select 
              value={currentStatus} 
              onValueChange={(val) => {
                setCurrentStatus(val as OpeningDetail['status']);
                updateStatusMutation.mutate(val as OpeningDetail['status']);
              }}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
            {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
          
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
        
      </CardContent>
    </Card>
  );
};

const OpeningsList: React.FC<OpeningsListProps> = ({ filters }) => {
  const { data: openings, isLoading, error } = useOpenings(filters);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Erro ao carregar aberturas: {error.message}</div>;
  }
  
  if (!openings || openings.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
        Nenhuma abertura encontrada com os filtros aplicados.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">{openings.length}</Badge>
        registros de abertura encontrados
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {openings.map(opening => (
          <OpeningCard key={opening.id} opening={opening} />
        ))}
      </div>
    </div>
  );
};

export default OpeningsList;