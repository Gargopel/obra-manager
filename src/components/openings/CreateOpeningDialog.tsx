import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS, generateApartmentNumbers, OPENING_TYPES_APARTMENT, OPENING_TYPES_CIRCULATION, OPENING_TYPES_FIRST_FLOOR, OPENING_TYPES_ENTRANCE } from '@/utils/construction-structure';
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
  
  // Estados para controlar a visibilidade dos campos
  const [showApartment, setShowApartment] = useState(false);
  const [showFloor, setShowFloor] = useState(false);
  const [availableOpeningTypes, setAvailableOpeningTypes] = useState<{ id: string; name: string }[]>([]);
  
  // Determina se é uma abertura especial (Circulação, Entrada do Bloco)
  const isSpecialOpening = () => {
    const selectedType = configData?.openingTypes.find(t => t.id === openingTypeId);
    return selectedType?.name === 'Circulação' || selectedType?.name === 'Entrada do Bloco';
  };
  
  // Determina se é uma abertura de apartamento do 1º andar
  const isFirstFloorApartment = () => {
    return floorNumber === 1 && apartmentNumber && !isSpecialOpening();
  };
  
  // Atualiza os tipos de abertura disponíveis com base no bloco, apartamento e andar
  useEffect(() => {
    if (!configData) return;
    
    let typesToShow: string[] = [];
    
    if (isSpecialOpening()) {
      // Para Circulação e Entrada do Bloco, mostrar apenas esses tipos
      const specialType = configData.openingTypes.find(t => t.name === 'Circulação' || t.name === 'Entrada do Bloco');
      if (specialType) {
        typesToShow = [specialType.name];
      }
    } else if (apartmentNumber && floorNumber === 1) {
      // Apartamento do 1º andar: Q1, Q2, Banheiro, Cozinha + Poço
      typesToShow = [...OPENING_TYPES_APARTMENT, ...OPENING_TYPES_FIRST_FLOOR];
    } else if (apartmentNumber) {
      // Apartamento normal: Q1, Q2, Banheiro, Cozinha
      typesToShow = OPENING_TYPES_APARTMENT;
    } else if (floorNumber) {
      // Andar (sem apartamento): Circulação
      typesToShow = OPENING_TYPES_CIRCULATION;
    }
    
    const filteredTypes = configData.openingTypes.filter(t => typesToShow.includes(t.name));
    setAvailableOpeningTypes(filteredTypes);
    
    // Reset opening type if it's not in the new list
    if (openingTypeId && !filteredTypes.some(t => t.id === openingTypeId)) {
      setOpeningTypeId('');
    }
  }, [blockId, apartmentNumber, floorNumber, openingTypeId, configData, isSpecialOpening]);
  
  // Atualiza a visibilidade dos campos com base no tipo de abertura selecionado
  useEffect(() => {
    const isSpecial = isSpecialOpening();
    setShowApartment(!isSpecial);
    setShowFloor(isSpecial);
    
    if (isSpecial) {
      setApartmentNumber(undefined);
    }
  }, [openingTypeId, configData]);
  
  const resetForm = () => {
    setBlockId('');
    setApartmentNumber(undefined);
    setFloorNumber(undefined);
    setOpeningTypeId('');
    setShowApartment(false);
    setShowFloor(false);
    setAvailableOpeningTypes([]);
  };
  
  const createOpeningMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!blockId || !openingTypeId) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }
      
      // Validações específicas
      if (showApartment && !apartmentNumber) {
        throw new Error('Selecione o apartamento.');
      }
      
      if (showFloor && floorNumber === undefined) {
        throw new Error('Selecione o andar.');
      }
      
      // Determinar floor_number
      let finalFloorNumber: number | null = null;
      if (floorNumber !== undefined) {
        finalFloorNumber = floorNumber;
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
          status: 'Em Andamento', // Default status
        });
        
      if (insertError) throw new Error('Erro ao registrar abertura: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Abertura registrada com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['openings'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOpeningMutation.mutate();
  };
  
  const isFormValid = () => {
    if (!blockId || !openingTypeId) return false;
    if (showApartment && !apartmentNumber) return false;
    if (showFloor && floorNumber === undefined) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Abertura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Bloco */}
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
          
          {/* Tipo de Abertura */}
          <div className="space-y-2">
            <Label htmlFor="opening-type">Tipo de Abertura *</Label>
            <Select 
              value={openingTypeId} 
              onValueChange={setOpeningTypeId}
              disabled={isLoadingConfig}
            >
              <SelectTrigger id="opening-type">
                <SelectValue placeholder="Selecione o Tipo" />
              </SelectTrigger>
              <SelectContent>
                {configData?.openingTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Andar (para Circulação e Entrada do Bloco) */}
          {showFloor && (
            <div className="space-y-2">
              <Label htmlFor="floor">Andar *</Label>
              <Select 
                value={floorNumber !== undefined ? floorNumber.toString() : ''} 
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
          
          {/* Apartamento (para aberturas de apartamento) */}
          {showApartment && (
            <div className="space-y-2">
              <Label htmlFor="apartment">Apartamento *</Label>
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
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createOpeningMutation.isPending || !isFormValid()}
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