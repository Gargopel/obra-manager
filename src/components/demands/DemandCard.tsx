import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Clock, MapPin, Home, Wrench, Calendar, Trash2, HardHat, UserPlus } from 'lucide-react';
import { DemandDetail } from '@/hooks/use-demands';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import useConfigData from '@/hooks/use-config-data';

interface DemandCardProps {
  demand: DemandDetail;
}

const DemandCard: React.FC<DemandCardProps> = ({ demand }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const { data: configData } = useConfigData();
  const isPending = demand.status === 'Pendente';

  // Buscar usuários para atribuição
  const { data: users } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });
  
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<DemandDetail>) => {
      const { error } = await supabase
        .from('demands')
        .update(payload)
        .eq('id', demand.id);
      if (error) throw error;

      // Se atribuiu um usuário, gera notificação
      if (payload.assigned_to) {
        await supabase.from('notifications').insert({
          user_id: payload.assigned_to,
          title: 'Nova Demanda Atribuída',
          message: `Você foi designado para a demanda no Bloco ${demand.block_id} - Apto ${demand.apartment_number}.`,
          link: '/demands'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      showSuccess('Atualizado com sucesso.');
    },
    onError: (error) => showError('Erro ao atualizar: ' + error.message),
  });

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta demanda permanentemente?')) {
      supabase.from('demands').delete().eq('id', demand.id).then(({error}) => {
        if(!error) {
          showSuccess('Excluído');
          queryClient.invalidateQueries({ queryKey: ['demands'] });
        }
      });
    }
  };
  
  const optimizedImageUrl = demand.image_url ? `${demand.image_url}?width=1000&quality=80` : undefined;
  
  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Bloco {demand.block_id} - Apto {demand.apartment_number}
          </CardTitle>
          <Badge className={isPending ? 'bg-yellow-500' : 'bg-green-500'}>{demand.status}</Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1">
          <Calendar className="w-4 h-4 mr-1" />
          {format(new Date(demand.created_at), 'dd/MM/yyyy HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary"><Wrench className="w-3 h-3 mr-1" />{demand.service_type_name}</Badge>
          <Badge variant="secondary"><Home className="w-3 h-3 mr-1" />{demand.room_name}</Badge>
        </div>
        
        <p className="text-sm text-foreground/80 line-clamp-3">{demand.description || 'Sem descrição.'}</p>

        {/* Atribuição de Usuário (Admin) */}
        {isAdmin && isPending && (
          <div className="p-3 border rounded-lg bg-blue-50/30 dark:bg-blue-900/10 space-y-2">
            <Label className="text-xs font-bold flex items-center text-blue-600 dark:text-blue-400">
              <UserPlus className="w-3 h-3 mr-1" /> EXECUTAR DEMANDA:
            </Label>
            <Select 
              value={demand.assigned_to || 'none'} 
              onValueChange={(val) => updateMutation.mutate({ assigned_to: val === 'none' ? null : val })}
            >
              <SelectTrigger className="h-8 text-xs border-blue-200">
                <SelectValue placeholder="Atribuir a um usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Atribuído</SelectItem>
                {users?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pendência de Empreiteiro */}
        <div className="p-3 border rounded-lg bg-accent/30 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`contractor-pending-${demand.id}`}
              checked={demand.is_contractor_pending}
              onCheckedChange={(checked) => {
                updateMutation.mutate({ 
                  is_contractor_pending: !!checked,
                  contractor_id: !checked ? null : demand.contractor_id 
                });
              }}
            />
            <Label htmlFor={`contractor-pending-${demand.id}`} className="text-xs font-semibold">Pendência de Empreiteiro?</Label>
          </div>
          {demand.is_contractor_pending && (
            <Select 
              value={demand.contractor_id || 'none'} 
              onValueChange={(val) => updateMutation.mutate({ contractor_id: val === 'none' ? null : val })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione o Empreiteiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Selecionado</SelectItem>
                {configData?.contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground italic">Por: {demand.user_first_name}</div>
          <div className="flex space-x-2">
            {demand.image_url && (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm">Ver Foto</Button></DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <img src={optimizedImageUrl} alt="Demanda" className="w-full h-auto rounded-lg" />
                </DialogContent>
              </Dialog>
            )}
            <Button 
              size="sm"
              variant={isPending ? 'default' : 'secondary'}
              className={isPending ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => updateMutation.mutate({ 
                status: isPending ? 'Resolvido' : 'Pendente',
                resolved_at: isPending ? new Date().toISOString() : null
              })}
            >
              {isPending ? 'Resolver' : 'Reabrir'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandCard;