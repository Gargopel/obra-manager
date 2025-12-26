import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]); // Mudado para array para múltipla seleção
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const isFloorBased = locationType === 'Andar Específico' || locationType === 'Andar da Circulação';

  const resetForm = () => {
    setBlockId('');
    setLocationType(ASSIGNMENT_LOCATION_TYPES[0]);
    setApartmentNumber('');
    setSelectedFloors([]);
    setServiceTypeId('');
    setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      
      // Preparar os dados para inserção
      let payloads = [];

      if (isFloorBased && selectedFloors.length > 0) {
        // Criar um registro para cada andar selecionado
        payloads = selectedFloors.map(floor => ({
          user_id: user.id,
          block_id: blockId,
          location_type: locationType,
          apartment_number: null,
          floor_number: parseInt(floor),
          service_type_id: serviceTypeId || null,
          notes: notes.trim() || null,
        }));
      } else {
        // Registro único (Bloco todo ou Apto específico)
        payloads = [{
          user_id: user.id,
          block_id: blockId,
          location_type: locationType,
          apartment_number: locationType === 'Apartamento Específico' ? apartmentNumber : null,
          floor_number: null, // No caso de apto, o andar pode ser derivado se necessário, mas aqui seguimos o padrão anterior
          service_type_id: serviceTypeId || null,
          notes: notes.trim() || null,
        }];
      }

      const { error } = await supabase.from('measurements').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Solicitação(ões) de conferência enviada(s) com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
    onError: (err: any) => showError(err.message),
  });

  const isFormValid = blockId && locationType && serviceTypeId && 
    (locationType === 'Apartamento Específico' ? apartmentNumber : true) &&
    (isFloorBased ? selectedFloors.length > 0 : true);

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="max-w-md backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-white/20 shadow-2xl">
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
              <Select value={locationType} onValueChange={(val) => { setLocationType(val); setSelectedFloors([]); setApartmentNumber(''); }}>
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

          {isFloorBased && (
            <div className="space-y-3">
              <Label>Andares (Selecione um ou mais) *</Label>
              <ToggleGroup 
                type="multiple" 
                variant="outline" 
                className="justify-start flex-wrap gap-2"
                value={selectedFloors}
                onValueChange={setSelectedFloors}
              >
                {[1, 2, 3, 4, 5].map(f => (
                  <ToggleGroupItem 
                    key={f} 
                    value={f.toString()} 
                    className="w-12 h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {f}º
                  </ToggleGroupItem>
                ))}
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Conferir rejunte da cozinha" className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={!isFormValid || createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            {isFloorBased && selectedFloors.length > 1 
              ? `Enviar ${selectedFloors.length} Solicitações` 
              : 'Enviar Solicitação'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeasurementDialog;