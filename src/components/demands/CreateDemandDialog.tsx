"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, HardHat, ListPlus } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { uploadFile } from '@/integrations/supabase/storage';

const MAX_IMAGE_WIDTH = 1200;

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;
        if (width > MAX_IMAGE_WIDTH) {
          height *= MAX_IMAGE_WIDTH / width;
          width = MAX_IMAGE_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Falha na compactação da imagem.'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface CreateDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateDemandDialog: React.FC<CreateDemandDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [description, setDescription] = useState('');
  const [isContractorPending, setIsContractorPending] = useState(false);
  const [contractorId, setContractorId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const resetForm = () => {
    setSelectedBlocks([]);
    setSelectedApartments([]);
    setServiceTypeId('');
    setRoomId('');
    setDescription('');
    setIsContractorPending(false);
    setContractorId('');
    setImageFile(null);
  };
  
  const createDemandMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (selectedBlocks.length === 0 || selectedApartments.length === 0 || !serviceTypeId || !roomId) {
        throw new Error('Preencha os campos obrigatórios.');
      }
      
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressedFile = await compressImage(imageFile);
        imageUrl = await uploadFile(compressedFile, 'demands');
      }
      
      const payloads: any[] = [];
      selectedBlocks.forEach(block => {
        selectedApartments.forEach(apt => {
          payloads.push({
            user_id: user.id,
            block_id: block,
            apartment_number: apt,
            service_type_id: serviceTypeId,
            room_id: roomId,
            description: description.trim() || null,
            is_contractor_pending: isContractorPending,
            contractor_id: isContractorPending && contractorId ? contractorId : null,
            image_url: imageUrl,
            status: 'Pendente',
          });
        });
      });
      
      const { error: insertError } = await supabase.from('demands').insert(payloads);
      if (insertError) throw new Error('Erro ao registrar: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Demandas registradas com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
    },
    onError: (error: any) => showError(error.message),
  });
  
  const isFormValid = selectedBlocks.length > 0 && selectedApartments.length > 0 && serviceTypeId && roomId;

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-white/20 p-0 overflow-hidden flex flex-col h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center text-xl">
            <ListPlus className="w-5 h-5 mr-2 text-primary" />
            Nova Demanda Simples
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="space-y-6">
            
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-primary">Blocos (Múltiplos) *</Label>
              <div className="p-2 border rounded-md bg-background/50 max-h-24 overflow-y-auto">
                <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap gap-1.5" value={selectedBlocks} onValueChange={setSelectedBlocks}>
                  {BLOCKS.map(b => <ToggleGroupItem key={b} value={b} className="w-8 h-8 text-xs">{b}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Serviço *</Label>
                <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{configData?.serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Cômodo *</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Local" /></SelectTrigger>
                  <SelectContent>{configData?.rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-primary">Apartamentos/Circulação (Múltiplos) *</Label>
              <div className="p-2 border rounded-lg bg-background/50 max-h-48 overflow-y-auto">
                <ToggleGroup type="multiple" variant="outline" className="grid grid-cols-4 gap-1.5" value={selectedApartments} onValueChange={setSelectedApartments}>
                  {APARTMENT_NUMBERS.map(a => <ToggleGroupItem key={a} value={a} className="text-[10px] h-7">{a}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-red-50/50 dark:bg-red-900/10 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="is-contractor" checked={isContractorPending} onCheckedChange={(val) => setIsContractorPending(!!val)} />
                <Label htmlFor="is-contractor" className="text-xs font-bold flex items-center cursor-pointer"><HardHat className="w-3 h-3 mr-1 text-red-500" /> Pendência de Empreiteiro?</Label>
              </div>
              {isContractorPending && (
                <Select value={contractorId} onValueChange={setContractorId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Qual empreiteiro?" /></SelectTrigger>
                  <SelectContent>
                    {configData?.contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que aconteceu?" className="text-sm" rows={3} />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Foto (Opcional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) setImageFile(file);
              }} className="h-10 text-xs" />
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-6 border-t bg-background/50">
          <Button onClick={() => createDemandMutation.mutate()} disabled={createDemandMutation.isPending || !isFormValid} className="w-full h-12 text-base font-bold">
            {createDemandMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Registrar {selectedBlocks.length * selectedApartments.length} Demandas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDemandDialog;