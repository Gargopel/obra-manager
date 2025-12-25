import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, MapPin, Home, Wrench, Calendar, Trash2 } from 'lucide-react';
import { DemandDetail } from '@/hooks/use-demands';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import { deleteFile } from '@/integrations/supabase/storage';

interface DemandCardProps {
  demand: DemandDetail;
}

const DemandCard: React.FC<DemandCardProps> = ({ demand }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const isPending = demand.status === 'Pendente';
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: 'Pendente' | 'Resolvido') => {
      const updateData: { status: string; resolved_at: string | null } = {
        status: newStatus,
        resolved_at: newStatus === 'Resolvido' ? new Date().toISOString() : null,
      };
      
      const { error } = await supabase
        .from('demands')
        .update(updateData)
        .eq('id', demand.id);
        
      if (error) throw error;
    },
    onSuccess: (data, newStatus) => {
      showSuccess(`Demanda marcada como ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar status: ' + error.message);
    },
  });
  
  const deleteDemandMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Tenta deletar a imagem associada (se houver)
      if (demand.image_url) {
        await deleteFile(demand.image_url);
      }
      
      // 2. Deleta a demanda do banco de dados
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Demanda excluída com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error) => {
      showError('Erro ao excluir demanda: ' + error.message);
    },
  });

  const handleToggleStatus = () => {
    const newStatus = isPending ? 'Resolvido' : 'Pendente';
    updateStatusMutation.mutate(newStatus);
  };
  
  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta demanda permanentemente?')) {
      deleteDemandMutation.mutate(demand.id);
    }
  };
  
  const statusColor = isPending ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600';
  const statusText = isPending ? 'Pendente' : 'Resolvido';
  const toggleButtonText = isPending ? 'Marcar como Resolvido' : 'Reabrir Demanda';
  
  const creatorName = `${demand.user_first_name || ''} ${demand.user_last_name || ''}`.trim() || 'Desconhecido';
  
  // Adiciona parâmetros de transformação para otimizar o carregamento da imagem
  const optimizedImageUrl = demand.image_url ? `${demand.image_url}?width=1000&quality=80` : undefined;
  
  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Bloco {demand.block_id} - Apto {demand.apartment_number}
          </CardTitle>
          <Badge className={statusColor}>{statusText}</Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1">
          <Calendar className="w-4 h-4 mr-1" />
          Criado em: {format(new Date(demand.created_at), 'dd/MM/yyyy HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {/* Usar flex-wrap para evitar overflow de badges */}
          <Badge variant="secondary" className="flex items-center">
            <Wrench className="w-3 h-3 mr-1" />
            {demand.service_type_name}
          </Badge>
          <Badge variant="secondary" className="flex items-center">
            <Home className="w-3 h-3 mr-1" />
            {demand.room_name}
          </Badge>
        </div>
        <p className="text-sm text-foreground/80 line-clamp-3">{demand.description}</p>
        <div className="flex justify-between items-center pt-2 border-t border-border/50 flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">
            Registrado por: {creatorName}
          </div>
          <div className="flex space-x-2">
            {demand.image_url && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Ver Imagem</Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-[90vw] md:max-w-xl lg:max-w-3xl">
                  {/* Ajustado para ser mais responsivo em mobile */}
                  <DialogHeader>
                    <DialogTitle>Imagem da Demanda</DialogTitle>
                  </DialogHeader>
                  <img 
                    src={optimizedImageUrl} // Usando URL otimizada
                    alt={`Imagem da demanda ${demand.id}`} 
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </DialogContent>
              </Dialog>
            )}
            
            {/* Botão de Excluir (Apenas para Admin) */}
            {isAdmin && (
              <Button 
                onClick={handleDelete}
                disabled={deleteDemandMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {deleteDemandMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
            
            <Button 
              onClick={handleToggleStatus}
              disabled={updateStatusMutation.isPending}
              variant={isPending ? 'default' : 'secondary'}
              className={isPending ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                isPending ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />
              )}
              {toggleButtonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandCard;