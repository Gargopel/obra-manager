import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Clock, MapPin, Home, Wrench, Calendar, Trash2, HardHat, UserPlus, AlertTriangle } from 'lucide-react';
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

// Usando React.memo para evitar re-renderizações desnecessárias
const DemandCard: React.FC<DemandCardProps> = React.memo(({ demand }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const { data: configData } = useConfigData();
  const isPending = demand.status === 'Pendente';

  const optimizedImageUrl = demand.image_url 
    ? `${demand.image_url}?width=800&quality=70` 
    : undefined;

  const { data: allDemands } = useQuery({
    queryKey: ['demands-local', demand.block_id, demand.apartment_number],
    queryFn: async () => {
      const { data } = await supabase
        .from('demands_with_details')
        .select('*')
        .eq('block_id', demand.block_id)
        .eq('apartment_number', demand.apartment_number)
        .eq('status', 'Pendente');
      return data || [];
    },
    enabled: isPending,
    staleTime: 30000 // Cache por 30s para evitar excesso de requisições
  });

  const myDependencies = configData?.serviceDependencies.filter(d => d.service_id === demand.service_type_id) || [];
  const blockers = allDemands?.filter(d => 
    d.id !== demand.id && 
    myDependencies.some(dep => dep.depends_on_id === d.service_type_id)
  ) || [];

  const isBlocked = blockers.length > 0;

  const { data: users } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name');
      return data || [];
    },
    enabled: isAdmin,
    staleTime: 120000
  });
  
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<DemandDetail>) => {
      const { error } = await supabase.from('demands').update(payload).eq('id', demand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      showSuccess('Atualizado.');
    }
  });

  return (
    <Card className={`bg-card/95 border ${isBlocked ? 'border-orange-500' : 'border-border'} shadow-md hover:shadow-lg transition-shadow duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {demand.block_id} - {demand.apartment_number}
          </CardTitle>
          <Badge className={isPending ? 'bg-yellow-500' : 'bg-green-500'}>{demand.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {isBlocked && (
          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg text-xs">
            <p className="font-bold text-orange-700">Bloqueado por:</p>
            <p className="truncate">{blockers.map(b => b.service_type_name).join(', ')}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">{demand.service_type_name}</Badge>
          <Badge variant="outline" className="text-[10px]">{demand.room_name}</Badge>
        </div>
        
        <p className="text-sm line-clamp-2 italic text-muted-foreground">{demand.description || 'Sem descrição.'}</p>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">{demand.user_first_name}</span>
          <div className="flex space-x-1">
            {demand.image_url && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="xs" className="h-7 text-[10px]">Foto</Button>
                </DialogTrigger>
                <DialogContent>
                  <img src={optimizedImageUrl} alt="Obra" className="w-full h-auto rounded-md" />
                </DialogContent>
              </Dialog>
            )}
            <Button 
              size="xs"
              className={`h-7 text-[10px] font-bold ${isPending ? 'bg-green-600' : 'bg-blue-600'}`}
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
});

export default DemandCard;