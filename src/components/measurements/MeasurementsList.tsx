import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Wrench, Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import useMeasurements, { MeasurementDetail } from '@/hooks/use-measurements';
import { format } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import CheckMeasurementDialog from './CheckMeasurementDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const MeasurementCard: React.FC<{ measurement: MeasurementDetail, onCheck: (m: MeasurementDetail) => void }> = ({ measurement, onCheck }) => {
  const { user, isAdmin } = useSession();
  const queryClient = useQueryClient();
  const isPending = measurement.status === 'Aberta';
  const isOwner = user?.id === measurement.user_id;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('measurements').delete().eq('id', measurement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Medição excluída.');
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
    onError: (err: any) => showError(err.message),
  });

  const locationText = measurement.apartment_number 
    ? `Apto ${measurement.apartment_number}`
    : measurement.floor_number ? `${measurement.floor_number}º Andar` : measurement.location_type;

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-lg border border-white/30 transition-all hover:shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            Bloco {measurement.block_id} - {locationText}
          </CardTitle>
          <Badge variant={isPending ? 'default' : (measurement.result === 'Concluída' ? 'outline' : 'destructive')}>
            {isPending ? 'Aberta' : measurement.result}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-xs">
          <Wrench className="w-3 h-3 mr-1" /> {measurement.service_type_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {measurement.notes && <p className="text-sm italic text-muted-foreground">"{measurement.notes}"</p>}
        {!isPending && measurement.missing_details && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded text-xs">
            <p className="font-semibold text-red-600 dark:text-red-400">O que falta:</p>
            <p>{measurement.missing_details}</p>
          </div>
        )}
        
        <div className="pt-2 border-t text-[10px] text-muted-foreground flex flex-col gap-1">
          <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(measurement.created_at), 'dd/MM/yyyy HH:mm')} por {measurement.requester_first_name}</div>
          {!isPending && <div className="flex items-center text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Conferido por {measurement.checker_first_name}</div>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {isPending && isOwner && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate()}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isPending && (
            <Button onClick={() => onCheck(measurement)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Conferir
            </Button>
          )}
          {!isPending && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => onCheck(measurement)}>Re-avaliar</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MeasurementsList: React.FC<{ filters: any }> = ({ filters }) => {
  const { data: measurements, isLoading } = useMeasurements(filters);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementDetail | null>(null);
  const [isCheckOpen, setIsCheckOpen] = useState(false);

  const handleCheck = (m: MeasurementDetail) => {
    setSelectedMeasurement(m);
    setIsCheckOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">{measurements?.length || 0}</Badge>
        registros de medição encontrados
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {measurements?.map(m => <MeasurementCard key={m.id} measurement={m} onCheck={handleCheck} />)}
        {measurements?.length === 0 && <p className="col-span-full text-center text-muted-foreground p-10">Nenhuma solicitação encontrada.</p>}
        
        <CheckMeasurementDialog open={isCheckOpen} onOpenChange={setIsCheckOpen} measurement={selectedMeasurement} />
      </div>
    </div>
  );
};

export default MeasurementsList;