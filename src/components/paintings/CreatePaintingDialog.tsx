import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS, PAINTING_LOCATIONS, PAINTING_COATS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface CreatePaintingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePaintingDialog: React.FC<CreatePaintingDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState<string | undefined>(undefined);
  const [painterId, setPainterId] = useState('');
  const [location, setLocation] = useState<string>(PAINTING_LOCATIONS[0]);
  const [coat, setCoat] = useState<string>(PAINTING_COATS[0]); // Novo estado para demão
  
  const isApartmentRequired = location !== 'Circulação';
  
  useEffect(() => {
    // Reset apartment number if location is 'Circulação'
    if (!isApartmentRequired) {
      setApartmentNumber(undefined);
    }
  }, [location, isApartmentRequired]);

  const resetForm = () => {
    setBlockId('');
    setApartmentNumber(undefined);
    setPainterId('');
    setLocation(PAINTING_LOCATIONS[0]);
    setCoat(PAINTING_COATS[0]); // Resetar demão
  };
  
  const createPaintingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!blockId || !painterId || (isApartmentRequired && !apartmentNumber) || !coat) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }
      
      const { error: insertError } = await supabase
        .from('paintings')
        .insert({
          user_id: user.id,
          block_id: blockId,
          apartment_number: apartmentNumber || null,
          painter_id: painterId,
          location: location,
          status: 'Em Andamento', // Default status
          coat: coat, // Incluindo demão
        });
        
      if (insertError) throw new Error('Erro ao registrar pintura: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Serviço de pintura registrado com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPaintingMutation.mutate();
  };
  
  const isFormValid = blockId && painterId && coat && (!isApartmentRequired || apartmentNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Serviço de Pintura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Localização da Pintura */}
          <div className="space-y-2">
            <Label htmlFor="location">Local da Pintura</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Selecione o Local" />
              </SelectTrigger>
              <SelectContent>
                {PAINTING_LOCATIONS.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bloco e Apartamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block">Bloco</Label>
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
              <Label htmlFor="apartment">Apartamento {isApartmentRequired ? '*' : '(Opcional)'}</Label>
              <Select 
                value={apartmentNumber || ''} 
                onValueChange={setApartmentNumber}
                disabled={!isApartmentRequired}
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
          
          {/* Pintor e Demão */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="painter">Pintor Responsável</Label>
              <Select value={painterId} onValueChange={setPainterId} disabled={isLoadingConfig}>
                <SelectTrigger id="painter">
                  <SelectValue placeholder="Selecione o Pintor" />
                </SelectTrigger>
                <SelectContent>
                  {configData?.painters.map(painter => (
                    <SelectItem key={painter.id} value={painter.id}>{painter.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coat">Demão</Label>
              <Select value={coat} onValueChange={setCoat}>
                <SelectTrigger id="coat">
                  <SelectValue placeholder="Selecione a Demão" />
                </SelectTrigger>
                <SelectContent>
                  {PAINTING_COATS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createPaintingMutation.isPending || !isFormValid}
            >
              {createPaintingMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Pintura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaintingDialog;