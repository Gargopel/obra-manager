"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, CalendarIcon, Plus, Trash2, Home, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSession } from '@/contexts/SessionContext';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ScheduleSelection {
  id: string;
  blockId: string;
  floorNumber?: number;
  apartmentNumber?: string;
  serviceTypeId?: string;
}

const CreateScheduleDialog: React.FC<{ open: boolean, onOpenChange: (val: boolean) => void }> = ({ open, onOpenChange }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: configData } = useConfigData();

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [selections, setSelections] = useState<ScheduleSelection[]>([]);
  
  // Estados para o formulário de adição rápida
  const [tempBlock, setTempBlock] = useState('');
  const [tempFloor, setTempFloor] = useState<string>('');
  const [tempApt, setTempApt] = useState<string>('');
  const [tempService, setTempService] = useState<string>('');

  const addSelection = () => {
    if (!tempBlock) return;
    setSelections([...selections, {
      id: crypto.randomUUID(),
      blockId: tempBlock,
      floorNumber: tempFloor ? parseInt(tempFloor) : undefined,
      apartmentNumber: tempApt || undefined,
      serviceTypeId: tempService || undefined
    }]);
    // Reset parciais
    setTempFloor('');
    setTempApt('');
  };

  const removeSelection = (id: string) => {
    setSelections(selections.filter(s => s.id !== id));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !deadline || selections.length === 0) throw new Error('Preencha os dados obrigatórios.');
      
      // 1. Inserir Cronograma
      const { data: schedule, error: sError } = await supabase
        .from('schedules')
        .insert({
          user_id: user.id,
          title: title.trim(),
          deadline: deadline.toISOString()
        })
        .select()
        .single();
      
      if (sError) throw sError;

      // 2. Inserir Itens
      const itemPayloads = selections.map(s => ({
        schedule_id: schedule.id,
        block_id: s.blockId,
        floor_number: s.floorNumber || null,
        apartment_number: s.apartmentNumber || null,
        service_type_id: s.serviceTypeId || null
      }));

      const { error: iError } = await supabase.from('schedule_items').insert(itemPayloads);
      if (iError) throw iError;
    },
    onSuccess: () => {
      showSuccess('Cronograma criado com sucesso!');
      onOpenChange(false);
      setTitle('');
      setSelections([]);
      setDeadline(undefined);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (err: any) => showError(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" /> Montar Cronograma de Metas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Meta / Título *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Entrega Bloco A e B - Junho" />
            </div>
            <div className="space-y-2">
              <Label>Data de Entrega (Deadline) *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP', { locale: ptBR }) : "Selecione o prazo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Seletor de Itens */}
          <div className="p-4 border rounded-xl bg-accent/5 space-y-4">
            <h3 className="font-bold text-sm uppercase text-muted-foreground">Adicionar Escopo de Trabalho</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Bloco *</Label>
                <select className="w-full h-9 border rounded-md text-sm px-2" value={tempBlock} onChange={e => setTempBlock(e.target.value)}>
                  <option value="">Selecione</option>
                  {BLOCKS.map(b => <option key={b} value={b}>Bloco {b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Andar (Opcional)</Label>
                <select className="w-full h-9 border rounded-md text-sm px-2" value={tempFloor} onChange={e => { setTempFloor(e.target.value); setTempApt(''); }}>
                  <option value="">Todo Bloco</option>
                  {[1,2,3,4,5].map(f => <option key={f} value={f}>{f}º Andar</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apto (Opcional)</Label>
                <select className="w-full h-9 border rounded-md text-sm px-2" value={tempApt} onChange={e => setTempApt(e.target.value)}>
                  <option value="">Todos do Andar</option>
                  {APARTMENT_NUMBERS.filter(a => !tempFloor || a.startsWith(tempFloor)).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Serviço (Opcional)</Label>
                <select className="w-full h-9 border rounded-md text-sm px-2" value={tempService} onChange={e => setTempService(e.target.value)}>
                  <option value="">Todos os Serviços</option>
                  {configData?.serviceTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={addSelection} disabled={!tempBlock} className="w-full" variant="secondary">
              <Plus className="w-4 h-4 mr-2" /> Adicionar ao Escopo
            </Button>
          </div>

          {/* Lista de Selecionados */}
          <div className="space-y-2">
            <Label className="font-bold">Itens Selecionados ({selections.length})</Label>
            <div className="grid gap-2">
              {selections.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm animate-in slide-in-from-left-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="bg-primary/5">Bloco {s.blockId}</Badge>
                    {s.floorNumber && <Badge variant="outline">{s.floorNumber}º Andar</Badge>}
                    {s.apartmentNumber && <Badge variant="outline">Apto {s.apartmentNumber}</Badge>}
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      {s.serviceTypeId ? configData?.serviceTypes.find(sv => sv.id === s.serviceTypeId)?.name : 'Todos os Serviços'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeSelection(s.id)} className="text-destructive h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {selections.length === 0 && <p className="text-center text-sm text-muted-foreground py-10 italic border-2 border-dashed rounded-xl">Nenhum item adicionado ao escopo.</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-background shrink-0">
          <Button 
            className="w-full h-12 text-lg font-bold" 
            disabled={!title || !deadline || selections.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Confirmar e Criar Cronograma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScheduleDialog;