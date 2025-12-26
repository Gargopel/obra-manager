import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('measurements').insert({
        user_id: user.id,
        block_id: blockId,
        location_type: locationType,
        apartment_number: locationType === 'Apartamento Específico' ? apartmentNumber : null,
        floor_number: (locationType === 'Andar Específico' || locationType === 'Andar da Circulação') ? parseInt(floorNumber) : null,
        service_type_id: serviceTypeId || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Solicitação de conferência enviada!');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
    onError: (err: any) => showError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Solicitar Conferência</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
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
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>{ASSIGNMENT_LOCATION_TYPES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {locationType === 'Apartamento Específico' && (
            <div className="space-y-2">
              <Label>Apartamento *</Label>
              <Select value={apartmentNumber} onValueChange={setApartmentNumber}>
                <SelectTrigger><SelectValue placeholder="Apto" /></SelectTrigger>
                <SelectContent>{APARTMENT_NUMBERS.map(a => <SelectItem key={a} value={a}>{`Apto ${a}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {(locationType === 'Andar Específico' || locationType === 'Andar da Circulação') && (
            <div className="space-y-2">
              <Label>Andar *</Label>
              <Select value={floorNumber} onValueChange={setFloorNumber}>
                <SelectTrigger><SelectValue placeholder="Andar" /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(f => <SelectItem key={f} value={f.toString()}>{`${f}º Andar`}</SelectItem>)}</SelectContent>
              </Select>
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Conferir rejunte da cozinha" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={!blockId || !locationType || !serviceTypeId || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeasurementDialog;