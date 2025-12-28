import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, DoorClosed, Calendar, CheckCircle, Clock, Wrench, AlertTriangle, Trash2 } from 'lucide-react';
import useDoors, { DoorDetail } from '@/hooks/use-doors';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DOOR_STATUSES } from '@/utils/construction-structure';
import { useSession } from '@/contexts/SessionContext';

interface DoorsListProps {
  filters: any;
}

const getStatusColor = (status: DoorDetail['status']) => {
  switch (status) {
    case 'Instalada': return 'bg-blue-500 hover:bg-blue-600';
    case 'Entregue': return 'bg-green-500 hover:bg-green-600';
    case 'Corrigir': return 'bg-red-500 hover:bg-red-600';
    case 'Falta Arremate': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'Falta':
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: DoorDetail['status']) => {
  switch (status) {
    case 'Instalada': return CheckCircle;
    case 'Entregue': return DoorClosed;
    case 'Corrigir': return AlertTriangle;
    case 'Falta Arremate': return Wrench;
    case 'Falta':
    default: return Clock;
  }
};

export const DoorCard: React.FC<{ door: DoorDetail }> = ({ door }) => {
  const queryClient = useQueryClient();
  const { isAdmin } = useSession();
  const [currentStatus, setCurrentStatus] = React.useState(door.status);
  
  React.useEffect(() => {
    setCurrentStatus(door.status);
  }, [door.status]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: DoorDetail['status']) => {
      const { error } = await supabase.from('doors').update({ status: newStatus, last_updated_at: new Date().toISOString() }).eq('id', door.id);
      if (error) throw error;
    },
    onSuccess: (data, newStatus) => {
      showSuccess(`Status atualizado para ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['doors'] });
    },
    onError: (error: any) => showError('Erro ao atualizar: ' + error.message),
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('doors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Registro excluído.');
      queryClient.invalidateQueries({ queryKey: ['doors'] });
    },
    onError: (error: any) => showError('Erro ao excluir: ' + error.message),
  });
  
  const StatusIcon = getStatusIcon(door.status);
  const locationText = `Apto ${door.apartment_number} (${door.floor_number}º Andar)`;

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" />Bloco {door.block_id}</CardTitle>
          <Badge className={getStatusColor(door.status)}><StatusIcon className="w-3 h-3 mr-1" />{door.status}</Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1"><DoorClosed className="w-4 h-4 mr-1" />{door.door_type_name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary" className="flex items-center"><DoorClosed className="w-3 h-3 mr-1" />{locationText}</Badge>
        </div>
        <div className="text-[10px] text-muted-foreground pt-2 border-t">
          <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Criado: {format(new Date(door.created_at), 'dd/MM/yyyy HH:mm')}</div>
          <div className="flex items-center mt-1"><Clock className="w-3 h-3 mr-1" />Atualizado: {format(new Date(door.last_updated_at), 'dd/MM/yyyy HH:mm')}</div>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Status:</Label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val as any)}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>{DOOR_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => { if(window.confirm('Excluir?')) deleteMutation.mutate(door.id); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DoorsList: React.FC<DoorsListProps> = ({ filters }) => {
  const { data: doors, isLoading, error } = useDoors(filters);
  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!doors || doors.length === 0) return <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground">Nenhuma porta encontrada.</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">{doors.length}</Badge>
        registros de portas encontrados
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {doors.map(d => <DoorCard key={d.id} door={d} />)}
      </div>
    </div>
  );
};

export default DoorsList;