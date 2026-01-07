import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BLOCKS, APARTMENT_NUMBERS, ASSIGNMENT_LOCATION_TYPES } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface CreateMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateMeasurementDialog: React.FC<CreateMeasurementDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [blockId, setBlockId] = useState('');
  const [locationType, setLocationType] = useState(ASSIGNMENT_LOCATION_TYPES[0]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const isFloorBased = locationType === 'Andar Específico' || locationType === 'Andar da Circulação';
  const isApartmentBased = locationType === 'Apartamento Específico';

  const resetForm = () => {
    setBlockId('');
    setLocationType(ASSIGNMENT_LOCATION_TYPES[0]);
    setSelectedApartments([]);
    setSelectedFloors([]);
    setServiceTypeId('');
    setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      
      let payloads = [];

      if (isFloorBased && selectedFloors.length > 0) {
        payloads = selectedFloors.map(floor => ({
          user_id: user.id,
          block_id: blockId,
          location_type: locationType,
          floor_number: parseInt(floor),
          service_type_id: serviceTypeId || null,
          notes: notes.trim() || null,
        }));
      } else if (isApartmentBased && selectedApartments.length > 0) {
        payloads = selectedApartments.map(apt => ({
          user_id: user.id,
          block_id: blockId,
          location_type: locationType,
          apartment_number: apt,
          floor_number: parseInt(apt.charAt(0)),
          service_type_id: serviceTypeId || null,
          notes: notes.trim() || null,
        }));
      } else {
        payloads = [{
          user_id: user.id,
          block_id: blockId,
          location_type: locationType,
          service_type_id: serviceTypeId || null,
          notes: notes.trim() || null,
        }];
      }

      const { error } = await supabase.from('measurements').insert(payloads);
      if (error) throw error;

      // Buscar todos os usuários para notificar
      const { data: allUsers } = await supabase.from('profiles').select('id');
      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(u => ({
          user_id: u.id,
          title: 'Nova Solicitação de Medição',
          message: `Uma nova medição foi aberta no Bloco ${blockId}.`,
          link: '/measurements'
        }));
        // Filtra para não notificar o próprio autor da solicitação (opcional)
        const others = notifications.filter(n => n.user_id !== user.id);
        if (others.length > 0) await supabase.from('notifications').insert(others);
      }
    },
    onSuccess: () => {
      showSuccess('Solicitação(ões) enviada(s) com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
    onError: (err: any) => showError(err.message),
  });

  const isFormValid = blockId && locationType && serviceTypeId && 
    (isApartmentBased ? selectedApartments.length > 0 : true) &&
    (isFloorBased ? selectedFloors.length > 0 : true);

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader><DialogTitle>Solicitar Conferência</DialogTitle></DialogHeader>
        <ScrollArea className="flex-1 max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bloco *</Label>
                <Select value={blockId} onValueChange={setBlockId}>
                  <SelectTrigger><SelectValue placeholder="Bloco" /></SelectTrigger>
                  <SelectContent>{BLOCKS.map(b => <SelectItem key={b} value={b}>{`Bloco ${b}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Localização *</Label>
                <Select value={locationType} onValueChange={(val) => { setLocationType(val); setSelectedFloors([]); setSelectedApartments([]); }}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{ASSIGNMENT_LOCATION_TYPES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {isApartmentBased && (
              <div className="space-y-3">
                <Label>Apartamentos *</Label>
                <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-2" value={selectedApartments} onValueChange={setSelectedApartments}>
                  {APARTMENT_NUMBERS.map(a => <ToggleGroupItem key={a} value={a} className="text-xs h-8">{a}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            )}

            {isFloorBased && (
              <div className="space-y-3">
                <Label>Andares *</Label>
                <ToggleGroup type="multiple" variant="outline" className="justify-start gap-2" value={selectedFloors} onValueChange={setSelectedFloors}>
                  {[1, 2, 3, 4, 5].map(f => <ToggleGroupItem key={f} value={f.toString()} className="w-12 h-10">{f}º</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Serviço *</Label>
              <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                <SelectTrigger><SelectValue placeholder="Tipo de Serviço" /></SelectTrigger>
                <SelectContent>{configData?.serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas/Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Conferir rejunte" rows={3} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button onClick={() => createMutation.mutate()} disabled={!isFormValid || createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeasurementDialog;