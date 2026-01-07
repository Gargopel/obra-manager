"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { BLOCKS, APARTMENT_NUMBERS, generateApartmentNumbers } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Layers, Building, Home, CheckSquare, Info } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface BulkCreateDemandsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScopeMode = 'whole_block' | 'floors' | 'manual';

const BulkCreateDemandsDialog: React.FC<BulkCreateDemandsDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [scopeMode, setScopeMode] = useState<ScopeMode>('manual');
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);

  const resetForm = () => {
    setSelectedServices([]);
    setSelectedBlocks([]);
    setScopeMode('manual');
    setSelectedFloors([]);
    setSelectedApartments([]);
  };

  const calculateTotalRequests = () => {
    let unitsPerBlock = 0;
    if (scopeMode === 'whole_block') unitsPerBlock = 20; // 5 andares * 4 aptos
    else if (scopeMode === 'floors') unitsPerBlock = selectedFloors.length * 4;
    else unitsPerBlock = selectedApartments.length;

    return selectedServices.length * selectedBlocks.length * unitsPerBlock;
  };

  const createBulkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      
      const allApartments = generateApartmentNumbers();
      let targetUnits: string[] = [];

      if (scopeMode === 'whole_block') {
        targetUnits = allApartments;
      } else if (scopeMode === 'floors') {
        targetUnits = allApartments.filter(apt => selectedFloors.includes(apt[0]));
      } else {
        targetUnits = selectedApartments;
      }

      const payloads: any[] = [];

      selectedServices.forEach(serviceId => {
        selectedBlocks.forEach(blockId => {
          targetUnits.forEach(apt => {
            payloads.push({
              user_id: user.id,
              block_id: blockId,
              apartment_number: apt,
              service_type_id: serviceId,
              room_id: null, // Em lote geralmente não se especifica o cômodo exato
              status: 'Pendente',
              description: 'Gerado via cadastro em lote.'
            });
          });
        });
      });

      if (payloads.length === 0) throw new Error('Nenhuma combinação válida selecionada.');
      
      // Supabase insert handles arrays automatically
      const { error } = await supabase.from('demands').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      const total = calculateTotalRequests();
      showSuccess(`${total} demandas registradas com sucesso!`);
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
    },
    onError: (error: any) => showError(error.message),
  });

  const isFormValid = selectedServices.length > 0 && 
                      selectedBlocks.length > 0 && 
                      (scopeMode === 'whole_block' || 
                       (scopeMode === 'floors' && selectedFloors.length > 0) || 
                       (scopeMode === 'manual' && selectedApartments.length > 0));

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-2xl backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center text-xl">
            <Layers className="w-6 h-6 mr-2 text-primary" />
            Cadastro em Lote (Multi-Serviço)
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Crie centenas de demandas rapidamente selecionando os serviços e locais.</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-8">
            
            {/* 1. Serviços */}
            <div className="space-y-3">
              <Label className="text-base font-bold flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-blue-500" /> 1. Selecione os Serviços *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-accent/20">
                {configData?.serviceTypes.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`svc-${service.id}`} 
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setSelectedServices(prev => checked ? [...prev, service.id] : prev.filter(id => id !== service.id));
                      }}
                    />
                    <label htmlFor={`svc-${service.id}`} className="text-xs font-medium cursor-pointer leading-none">
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Blocos */}
            <div className="space-y-3">
              <Label className="text-base font-bold flex items-center">
                <Building className="w-4 h-4 mr-2 text-blue-500" /> 2. Selecione os Blocos *
              </Label>
              <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-1.5" value={selectedBlocks} onValueChange={setSelectedBlocks}>
                {BLOCKS.map(b => (
                  <ToggleGroupItem key={b} value={b} className="w-10 h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{b}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* 3. Alcance / Localização */}
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-base font-bold flex items-center">
                <Home className="w-4 h-4 mr-2 text-blue-500" /> 3. Defina o Alcance (Onde falta?)
              </Label>
              
              <ToggleGroup type="single" value={scopeMode} onValueChange={(val) => val && setScopeMode(val as ScopeMode)} className="justify-start">
                <ToggleGroupItem value="whole_block" className="px-4 py-2 h-auto text-xs flex flex-col">
                  <span className="font-bold">Bloco Inteiro</span>
                  <span className="text-[10px] opacity-70">Todos os 20 Aptos</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="floors" className="px-4 py-2 h-auto text-xs flex flex-col">
                  <span className="font-bold">Andares Específicos</span>
                  <span className="text-[10px] opacity-70">4 Aptos por andar</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="manual" className="px-4 py-2 h-auto text-xs flex flex-col">
                  <span className="font-bold">Manual</span>
                  <span className="text-[10px] opacity-70">Escolher Unidades</span>
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="p-4 bg-accent/30 rounded-lg min-h-[100px]">
                {scopeMode === 'whole_block' && (
                  <div className="flex items-center text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2">
                    <Info className="w-4 h-4 mr-2" />
                    O sistema criará automaticamente as demandas para os apartamentos 101 até o 504 de cada bloco selecionado.
                  </div>
                )}

                {scopeMode === 'floors' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95">
                    <Label className="text-xs">Quais andares?</Label>
                    <ToggleGroup type="multiple" variant="outline" className="justify-start gap-2" value={selectedFloors} onValueChange={setSelectedFloors}>
                      {[1, 2, 3, 4, 5].map(f => (
                        <ToggleGroupItem key={f} value={f.toString()} className="w-12 h-10">{f}º</ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                )}

                {scopeMode === 'manual' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95">
                    <Label className="text-xs">Quais apartamentos?</Label>
                    <div className="p-2 border rounded-lg bg-background/50 max-h-48 overflow-y-auto">
                      <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-1.5" value={selectedApartments} onValueChange={setSelectedApartments}>
                        {generateApartmentNumbers().map(a => (
                          <ToggleGroupItem key={a} value={a} className="text-[10px] h-7">{a}</ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 border-t bg-background/50">
          <div className="w-full flex flex-col items-center gap-3">
            {isFormValid && (
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 animate-bounce">
                Confirmado: Serão criados {calculateTotalRequests()} registros individuais.
              </div>
            )}
            <Button 
              onClick={() => createBulkMutation.mutate()} 
              disabled={createBulkMutation.isPending || !isFormValid} 
              className="w-full h-12 text-base font-bold shadow-lg"
            >
              {createBulkMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Registrar em Lote Agora
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateDemandsDialog;