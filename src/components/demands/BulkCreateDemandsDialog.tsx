"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { BLOCKS, generateApartmentNumbers } from '@/utils/construction-structure';
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
    if (scopeMode === 'whole_block') unitsPerBlock = 20; 
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
              room_id: null,
              status: 'Pendente',
              description: 'Gerado via cadastro em lote.'
            });
          });
        });
      });

      if (payloads.length === 0) throw new Error('Nenhuma combinação válida selecionada.');
      const { error } = await supabase.from('demands').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Sucesso! Registros criados.`);
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
      <DialogContent className="w-[95vw] max-w-2xl backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl flex flex-col h-[90vh] p-0 overflow-hidden border border-white/20">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center text-xl">
            <Layers className="w-6 h-6 mr-2 text-primary" />
            Cadastro em Lote (Múltiplos Itens)
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Preencha os passos abaixo para gerar os registros.</p>
        </DialogHeader>
        
        {isLoadingConfig ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground italic">Carregando serviços e blocos...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-10">
            {/* Passo 1: Serviços */}
            <div className="space-y-4">
              <Label className="text-base font-bold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Selecione os Serviços *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-xl bg-accent/10">
                {configData?.serviceTypes.map(service => (
                  <div key={service.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                    <Checkbox 
                      id={`svc-${service.id}`} 
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setSelectedServices(prev => checked ? [...prev, service.id] : prev.filter(id => id !== service.id));
                      }}
                      className="w-5 h-5"
                    />
                    <label htmlFor={`svc-${service.id}`} className="text-sm font-medium cursor-pointer flex-1">
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Passo 2: Blocos */}
            <div className="space-y-4">
              <Label className="text-base font-bold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Selecione os Blocos *
              </Label>
              <div className="p-4 border rounded-xl bg-accent/10">
                <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-2" value={selectedBlocks} onValueChange={setSelectedBlocks}>
                  {BLOCKS.map(b => (
                    <ToggleGroupItem key={b} value={b} className="w-12 h-12 text-sm font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      {b}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            {/* Passo 3: Alcance */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-bold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                Defina onde será aplicado
              </Label>
              
              <div className="flex flex-col space-y-4">
                <ToggleGroup type="single" value={scopeMode} onValueChange={(val) => val && setScopeMode(val as ScopeMode)} className="justify-start flex-wrap gap-2">
                  <ToggleGroupItem value="whole_block" className="px-4 py-6 h-auto flex flex-col border-2 data-[state=on]:border-primary">
                    <Building className="w-5 h-5 mb-1" />
                    <span className="font-bold text-xs">Blocos Inteiros</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="floors" className="px-4 py-6 h-auto flex flex-col border-2 data-[state=on]:border-primary">
                    <Layers className="w-5 h-5 mb-1" />
                    <span className="font-bold text-xs">Andares</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="manual" className="px-4 py-6 h-auto flex flex-col border-2 data-[state=on]:border-primary">
                    <Home className="w-5 h-5 mb-1" />
                    <span className="font-bold text-xs">Manual (Aptos)</span>
                  </ToggleGroupItem>
                </ToggleGroup>

                <div className="p-5 bg-accent/30 rounded-2xl border-2 border-dashed border-accent">
                  {scopeMode === 'whole_block' && (
                    <div className="flex items-center text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                      <Info className="w-5 h-5 mr-3 text-blue-500" />
                      Aplica para TODOS os apartamentos (101 a 504) dos blocos selecionados.
                    </div>
                  )}

                  {scopeMode === 'floors' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Quais andares?</Label>
                      <ToggleGroup type="multiple" variant="outline" className="justify-start gap-3" value={selectedFloors} onValueChange={setSelectedFloors}>
                        {[1, 2, 3, 4, 5].map(f => (
                          <ToggleGroupItem key={f} value={f.toString()} className="w-14 h-14 text-lg font-bold">
                            {f}º
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  )}

                  {scopeMode === 'manual' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Selecione as Unidades</Label>
                      <div className="p-3 border rounded-xl bg-background/50 max-h-60 overflow-y-auto">
                        <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-2" value={selectedApartments} onValueChange={setSelectedApartments}>
                          {generateApartmentNumbers().map(a => (
                            <ToggleGroupItem key={a} value={a} className="text-[10px] h-9 font-bold">
                              {a}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="p-6 border-t bg-background/80 backdrop-blur-md shrink-0">
          <div className="w-full flex flex-col items-center gap-4">
            {isFormValid && (
              <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                Atenção: {calculateTotalRequests()} registros serão criados.
              </div>
            )}
            <Button 
              onClick={() => createBulkMutation.mutate()} 
              disabled={createBulkMutation.isPending || !isFormValid || isLoadingConfig} 
              className="w-full h-14 text-lg font-black uppercase tracking-wider shadow-xl"
            >
              {createBulkMutation.isPending ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                'Finalizar Cadastro em Lote'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateDemandsDialog;