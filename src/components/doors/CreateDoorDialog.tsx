import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface CreateDoorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateDoorDialog: React.FC<CreateDoorDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [doorTypeId, setDoorTypeId] = useState('');
  
  const resetForm = () => {
    setSelectedBlocks([]);
    setSelectedApartments([]);
    setDoorTypeId('');
  };
  
  const createDoorMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (selectedBlocks.length === 0 || selectedApartments.length === 0 || !doorTypeId) {
        throw new Error('Preencha os campos obrigatórios.');
      }
      
      const payloads: any[] = [];

      selectedBlocks.forEach(block => {
        selectedApartments.forEach(apt => {
          payloads.push({
            user_id: user.id,
            block_id: block,
            apartment_number: apt,
            floor_number: parseInt(apt.charAt(0), 10),
            door_type_id: doorTypeId,
            status: 'Falta',
          });
        });
      });
      
      const { error: insertError } = await supabase.from('doors').insert(payloads);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      showSuccess('Portas registradas com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['doors'] });
    },
    onError: (error: any) => showError(error.message),
  });
  
  const isFormValid = selectedBlocks.length > 0 && selectedApartments.length > 0 && doorTypeId;

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
        <DialogHeader><DialogTitle>Registrar Portas (Lote)</DialogTitle></DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-primary">Blocos *</Label>
              <div className="p-2 border rounded-md bg-background/50 max-h-32 overflow-y-auto text-center">
                <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-2" value={selectedBlocks} onValueChange={setSelectedBlocks}>
                  {BLOCKS.map(b => <ToggleGroupItem key={b} value={b} className="w-10 h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{b}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Tipo/Local da Porta *</Label>
              <Select value={doorTypeId} onValueChange={setDoorTypeId} disabled={isLoadingConfig}>
                <SelectTrigger><SelectValue placeholder="Selecione o Tipo" /></SelectTrigger>
                <SelectContent>{configData?.doorTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-primary">Apartamentos *</Label>
              <div className="p-3 border rounded-lg bg-background/50 max-h-64 overflow-y-auto">
                <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-2" value={selectedApartments} onValueChange={setSelectedApartments}>
                  {APARTMENT_NUMBERS.map(a => (
                    <ToggleGroupItem key={a} value={a} className="text-xs h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      {a}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button onClick={() => createDoorMutation.mutate()} disabled={createDoorMutation.isPending || !isFormValid} className="w-full text-lg">
            {createDoorMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Registrar {selectedBlocks.length * selectedApartments.length} Portas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDoorDialog;