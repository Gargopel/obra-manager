import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [painterId, setPainterId] = useState('');
  const [location, setLocation] = useState<string>(PAINTING_LOCATIONS[0]);
  const [coat, setCoat] = useState<string>(PAINTING_COATS[0]);
  
  const isApartmentRequired = location !== 'Circulação';
  const isFloorBased = location === 'Circulação';

  const resetForm = () => {
    setSelectedBlocks([]);
    setSelectedApartments([]);
    setSelectedFloors([]);
    setPainterId('');
    setLocation(PAINTING_LOCATIONS[0]);
    setCoat(PAINTING_COATS[0]);
  };
  
  const createPaintingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (selectedBlocks.length === 0 || !painterId || !coat) {
        throw new Error('Preencha os campos obrigatórios (Blocos, Pintor e Demão).');
      }
      
      const payloads: any[] = [];

      selectedBlocks.forEach(block => {
        if (isApartmentRequired && selectedApartments.length > 0) {
          selectedApartments.forEach(apt => {
            payloads.push({
              user_id: user.id,
              block_id: block,
              apartment_number: apt,
              painter_id: painterId,
              location: location,
              status: 'Em Andamento',
              coat: coat,
            });
          });
        } else if (isFloorBased && selectedFloors.length > 0) {
          selectedFloors.forEach(floor => {
            payloads.push({
              user_id: user.id,
              block_id: block,
              apartment_number: null,
              painter_id: painterId,
              location: `${location} - ${floor}º Andar`,
              status: 'Em Andamento',
              coat: coat,
            });
          });
        } else if (!isApartmentRequired && !isFloorBased) {
          payloads.push({
            user_id: user.id,
            block_id: block,
            apartment_number: null,
            painter_id: painterId,
            location: location,
            status: 'Em Andamento',
            coat: coat,
          });
        }
      });

      if (payloads.length === 0) throw new Error('Selecione ao menos um local (Apartamento ou Andar).');
      
      const { error: insertError } = await supabase.from('paintings').insert(payloads);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      showSuccess('Serviços de pintura registrados com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['paintings'] });
    },
    onError: (error: any) => showError(error.message),
  });
  
  const isFormValid = selectedBlocks.length > 0 && painterId && coat && 
                      (!isApartmentRequired || selectedApartments.length > 0) &&
                      (!isFloorBased || selectedFloors.length > 0);

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
        <DialogHeader><DialogTitle>Registrar Pintura (Lote)</DialogTitle></DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Blocos */}
            <div className="space-y-2">
              <Label>Blocos *</Label>
              <div className="p-2 border rounded-md bg-background/50 max-h-32 overflow-y-auto">
                <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-2" value={selectedBlocks} onValueChange={setSelectedBlocks}>
                  {BLOCKS.map(b => (
                    <ToggleGroupItem key={b} value={b} className="w-10 h-10">{b}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            {/* Configuração */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local da Pintura</Label>
                <Select value={location} onValueChange={(val) => { setLocation(val); setSelectedApartments([]); setSelectedFloors([]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAINTING_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Demão</Label>
                <Select value={coat} onValueChange={setCoat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAINTING_COATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Pintor */}
            <div className="space-y-2">
              <Label>Pintor Responsável</Label>
              <Select value={painterId} onValueChange={setPainterId} disabled={isLoadingConfig}>
                <SelectTrigger><SelectValue placeholder="Selecione o Pintor" /></SelectTrigger>
                <SelectContent>{configData?.painters.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Apartamentos - COM ROLAGEM CORRIGIDA */}
            {isApartmentRequired && (
              <div className="space-y-2">
                <Label>Apartamentos *</Label>
                <div className="p-2 border rounded-md bg-background/50 max-h-48 overflow-y-auto">
                  <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-2" value={selectedApartments} onValueChange={setSelectedApartments}>
                    {APARTMENT_NUMBERS.map(a => <ToggleGroupItem key={a} value={a} className="text-xs h-8">{a}</ToggleGroupItem>)}
                  </ToggleGroup>
                </div>
              </div>
            )}

            {/* Andares - COM ROLAGEM CORRIGIDA */}
            {isFloorBased && (
              <div className="space-y-2">
                <Label>Andares *</Label>
                <div className="p-2 border rounded-md bg-background/50 max-h-32 overflow-y-auto">
                  <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-2" value={selectedFloors} onValueChange={setSelectedFloors}>
                    {[1, 2, 3, 4, 5].map(f => <ToggleGroupItem key={f} value={f.toString()} className="w-12 h-10">{f}º</ToggleGroupItem>)}
                  </ToggleGroup>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button onClick={() => createPaintingMutation.mutate()} disabled={createPaintingMutation.isPending || !isFormValid} className="w-full">
            {createPaintingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Registrar {selectedBlocks.length * (isApartmentRequired ? selectedApartments.length : isFloorBased ? selectedFloors.length : 1)} Registros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaintingDialog;