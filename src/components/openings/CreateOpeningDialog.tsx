import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS, OPENING_TYPES_CIRCULATION, OPENING_TYPES_ENTRANCE } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface CreateOpeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateOpeningDialog: React.FC<CreateOpeningDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState<string | undefined>(undefined);
  const [floorNumber, setFloorNumber] = useState<number | undefined>(undefined);
  const [openingTypeId, setOpeningTypeId] = useState('');
  
  // Determina o tipo selecionado para ajustar os campos
  const selectedType = configData?.openingTypes.find(t => t.id === openingTypeId);
  const typeName = selectedType?.name || '';
  
  // É uma abertura de área comum (Circulação, Entrada)
  const isCommonArea = OPENING_TYPES_CIRCULATION.includes(typeName) || OPENING_TYPES_ENTRANCE.includes(typeName);
  // É uma abertura de apartamento (Q1, Q2, Cozinha, etc)
  const isApartmentType = !isCommonArea && openingTypeId !== '';

  const resetForm = () => {
    setBlockId('');
    setApartmentNumber(undefined);
    setFloorNumber(undefined);
    setOpeningTypeId('');
  };
  
  const createOpeningMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!blockId || !openingTypeId) {
        throw new Error('Preencha os campos obrigatórios.');
      }
      
      if (isApartmentType && !apartmentNumber) {
        throw new Error('Selecione o apartamento.');
      }
      
      if (isCommonArea && floorNumber === undefined) {
        throw new Error('Selecione o andar.');
      }
      
      // Determinar floor_number final
      let finalFloorNumber: number | null = null;
      if (isCommonArea) {
        finalFloorNumber = floorNumber!;
      } else if (apartmentNumber) {
        finalFloorNumber = parseInt(apartmentNumber.charAt(0), 10);
      }
      
      const { error: insertError } = await supabase
        .from('openings')
        .insert({
          user_id: user.id,
          block_id: blockId,
          apartment_number: apartmentNumber || null,
          floor_number: finalFloorNumber,
          opening_type_id: openingTypeId,
          status: 'Em Andamento',
        });
        
      if (insertError) throw new Error('Erro ao registrar: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Abertura registrada com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['openings'] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOpeningMutation.mutate();
  };
  
  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Abertura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
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
            <Label htmlFor="opening-type">Tipo de Local/Abertura *</Label>
            <Select 
              value={openingTypeId} 
              onValueChange={setOpeningTypeId}
              disabled={isLoadingConfig}
            >
              <SelectTrigger id="opening-type">
                <SelectValue placeholder="O que está sendo medido?" />
              </SelectTrigger>
              <SelectContent>
                {configData?.openingTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isCommonArea && (
            <div className="space-y-2">
              <Label htmlFor="floor">Em qual andar? *</Label>
              <Select 
                value={floorNumber?.toString() || ''} 
                onValueChange={(val) => setFloorNumber(parseInt(val, 10))}
              >
                <SelectTrigger id="floor">
                  <SelectValue placeholder="Selecione o Andar" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>{`${floor}º Andar`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {isApartmentType && (
            <div className="space-y-2">
              <Label htmlFor="apartment">Qual apartamento? *</Label>
              <Select 
                value={apartmentNumber || ''} 
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
          )}
          
          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={createOpeningMutation.isPending || !blockId || !openingTypeId}
              className="w-full"
            >
              {createOpeningMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Abertura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOpeningDialog;