import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS, DOOR_LOCATIONS } from '@/utils/construction-structure';
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
  
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [doorTypeId, setDoorTypeId] = useState('');
  
  const resetForm = () => {
    setBlockId('');
    setApartmentNumber('');
    setDoorTypeId('');
  };
  
  // Calcula o andar com base no número do apartamento
  const getFloorNumber = (aptNumber: string): number | undefined => {
    if (aptNumber.length === 3 || aptNumber.length === 4) {
      return parseInt(aptNumber.charAt(0), 10);
    }
    return undefined;
  };
  
  const createDoorMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!blockId || !apartmentNumber || !doorTypeId) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }
      
      const floorNumber = getFloorNumber(apartmentNumber);
      if (floorNumber === undefined) {
        throw new Error('Número de apartamento inválido.');
      }
      
      const { error: insertError } = await supabase
        .from('doors')
        .insert({
          user_id: user.id,
          block_id: blockId,
          apartment_number: apartmentNumber,
          floor_number: floorNumber,
          door_type_id: doorTypeId,
          status: 'Falta', // Default status
        });
        
      if (insertError) throw new Error('Erro ao registrar porta: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Porta registrada com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['doors'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDoorMutation.mutate();
  };
  
  const isFormValid = blockId && apartmentNumber && doorTypeId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Porta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Bloco e Apartamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block">Bloco *</Label>
              <Select value={blockId} onValueChange={setBlockId}>
                <SelectTrigger id="block">
                  <SelectValue placeholder="Selecione o Bloco" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKS.map(block => (
                    <SelectItem key={block} value={block}>{`Bloco ${block}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apartment">Apartamento *</Label>
              <Select 
                value={apartmentNumber} 
                onValueChange={setApartmentNumber}
              >
                <SelectTrigger id="apartment">
                  <SelectValue placeholder="Selecione o Apto" />
                </SelectTrigger>
                <SelectContent>
                  {APARTMENT_NUMBERS.map(apt => (
                    <SelectItem key={apt} value={apt}>{`Apto ${apt}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tipo de Porta */}
          <div className="space-y-2">
            <Label htmlFor="door-type">Local da Porta (Tipo) *</Label>
            <Select 
              value={doorTypeId} 
              onValueChange={setDoorTypeId}
              disabled={isLoadingConfig}
            >
              <SelectTrigger id="door-type">
                <SelectValue placeholder="Selecione o Tipo/Local" />
              </SelectTrigger>
              <SelectContent>
                {configData?.doorTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createDoorMutation.isPending || !isFormValid}
            >
              {createDoorMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Porta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDoorDialog;