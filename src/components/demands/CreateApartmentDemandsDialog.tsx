"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Plus, Trash2, Home, HardHat } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface DemandRow {
  id: string;
  serviceTypeId: string;
  roomId: string;
  description: string;
  isContractorPending: boolean;
  contractorId: string;
}

interface CreateApartmentDemandsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateApartmentDemandsDialog: React.FC<CreateApartmentDemandsDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [rows, setRows] = useState<DemandRow[]>([
    { id: crypto.randomUUID(), serviceTypeId: '', roomId: '', description: '', isContractorPending: false, contractorId: '' }
  ]);
  
  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), serviceTypeId: '', roomId: '', description: '', isContractorPending: false, contractorId: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof DemandRow, value: any) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const resetForm = () => {
    setBlockId('');
    setApartmentNumber('');
    setRows([{ id: crypto.randomUUID(), serviceTypeId: '', roomId: '', description: '', isContractorPending: false, contractorId: '' }]);
  };
  
  const createDemandsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!blockId || !apartmentNumber) throw new Error('Selecione o Bloco e o Apartamento.');
      
      const validRows = rows.filter(row => row.serviceTypeId && row.roomId);
      if (validRows.length === 0) throw new Error('Adicione ao menos uma demanda completa (Serviço e Cômodo).');
      
      const payloads = validRows.map(row => ({
        user_id: user.id,
        block_id: blockId,
        apartment_number: apartmentNumber,
        service_type_id: row.serviceTypeId,
        room_id: row.roomId,
        description: row.description.trim() || null,
        is_contractor_pending: row.isContractorPending,
        contractor_id: row.isContractorPending && row.contractorId ? row.contractorId : null,
        status: 'Pendente',
      }));
      
      const { error } = await supabase.from('demands').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`${rows.length} demandas registradas com sucesso!`);
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
    },
    onError: (error: any) => showError(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-2xl backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-white/20 flex flex-col max-h-[90vh] p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Home className="w-5 h-5 mr-2 text-primary" />
            Checklist de Demandas por Apartamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Bloco *</Label>
            <Select value={blockId} onValueChange={setBlockId}>
              <SelectTrigger><SelectValue placeholder="Bloco" /></SelectTrigger>
              <SelectContent>
                {BLOCKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Apartamento *</Label>
            <Select value={apartmentNumber} onValueChange={setApartmentNumber}>
              <SelectTrigger><SelectValue placeholder="Apto" /></SelectTrigger>
              <SelectContent>
                {APARTMENT_NUMBERS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="mb-4" />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {rows.map((row, index) => (
              <div key={row.id} className="p-4 border rounded-lg bg-background/50 space-y-4 relative group">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Item #{index + 1}</Badge>
                  {rows.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase">Serviço *</Label>
                    <Select value={row.serviceTypeId} onValueChange={(val) => updateRow(row.id, 'serviceTypeId', val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        {configData?.serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase">Cômodo *</Label>
                    <Select value={row.roomId} onValueChange={(val) => updateRow(row.id, 'roomId', val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Local" /></SelectTrigger>
                      <SelectContent>
                        {configData?.rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase">Descrição da Pendência</Label>
                  <Input 
                    value={row.description} 
                    onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    placeholder="Ex: Cerâmica trincada"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`contractor-${row.id}`} 
                      checked={row.isContractorPending} 
                      onCheckedChange={(val) => updateRow(row.id, 'isContractorPending', !!val)}
                    />
                    <Label htmlFor={`contractor-${row.id}`} className="text-[10px] font-bold flex items-center">
                      <HardHat className="w-3 h-3 mr-1" /> TERCEIRIZADO?
                    </Label>
                  </div>
                  
                  {row.isContractorPending && (
                    <Select value={row.contractorId} onValueChange={(val) => updateRow(row.id, 'contractorId', val)}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Qual?" /></SelectTrigger>
                      <SelectContent>
                        {configData?.contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addRow} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Outro Item ao Apto
            </Button>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t mt-4">
          <Button onClick={() => createDemandsMutation.mutate()} disabled={createDemandsMutation.isPending || !blockId || !apartmentNumber} className="w-full h-11">
            {createDemandsMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Finalizar Checklist do Apartamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateApartmentDemandsDialog;