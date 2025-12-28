"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Layers } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { uploadFile } from '@/integrations/supabase/storage';

const MAX_DESCRIPTION_LENGTH = 400;
const MAX_IMAGE_SIZE_MB = 5;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const resetForm = () => {
    setSelectedBlocks([]);
    setSelectedApartments([]);
    setServiceTypeId('');
    setRoomId('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
  };
  
  const createDemandMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (selectedBlocks.length === 0 || selectedApartments.length === 0 || !serviceTypeId || !roomId) {
        throw new Error('Preencha os campos obrigatórios (Blocos, Apartamentos, Serviço, Cômodo).');
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
            image_url: imageUrl,
            status: 'Pendente',
          });
        });
      });
      
      const { error: insertError } = await supabase
        .from('demands')
        .insert(payloads);
        
      if (insertError) throw new Error('Erro ao registrar demandas: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Demandas registradas com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDemandMutation.mutate();
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        showError(`A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const isFormValid = selectedBlocks.length > 0 && selectedApartments.length > 0 && serviceTypeId && roomId;
  const totalRegistros = selectedBlocks.length * selectedApartments.length;

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-white/20 flex flex-col max-h-[90vh] p-4 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Registrar Demandas em Lote</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-2">
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            
            {/* Seleção de Blocos */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-primary">Blocos *</Label>
              <div className="p-2 border rounded-md bg-background/50 max-h-24 overflow-y-auto">
                <ToggleGroup 
                  type="multiple" 
                  variant="outline" 
                  className="justify-start flex-wrap gap-1.5" 
                  value={selectedBlocks} 
                  onValueChange={setSelectedBlocks}
                >
                  {BLOCKS.map(b => (
                    <ToggleGroupItem 
                      key={b} 
                      value={b} 
                      className="w-8 h-8 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {b}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            {/* Serviço e Cômodo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceType" className="text-xs font-bold">Tipo de Serviço *</Label>
                <Select value={serviceTypeId} onValueChange={setServiceTypeId} disabled={isLoadingConfig}>
                  <SelectTrigger id="serviceType" className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {configData?.serviceTypes.map(service => (
                      <SelectItem key={service.id} value={service.id} className="text-xs">{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room" className="text-xs font-bold">Cômodo *</Label>
                <Select value={roomId} onValueChange={setRoomId} disabled={isLoadingConfig}>
                  <SelectTrigger id="room" className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o Cômodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {configData?.rooms.map(room => (
                      <SelectItem key={room.id} value={room.id} className="text-xs">{room.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seleção de Apartamentos */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-primary">Apartamentos *</Label>
              <div className="p-2 border rounded-lg bg-background/50 max-h-60 overflow-y-auto">
                <ToggleGroup 
                  type="multiple" 
                  variant="outline" 
                  className="grid grid-cols-4 gap-1.5" 
                  value={selectedApartments} 
                  onValueChange={setSelectedApartments}
                >
                  {APARTMENT_NUMBERS.map(a => (
                    <ToggleGroupItem 
                      key={a} 
                      value={a} 
                      className="text-[10px] h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {a}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            
            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold">Descrição (Opcional)</Label>
              <Textarea 
                id="description"
                value={description} 
                onChange={(e) => {
                  const words = e.target.value.split(/\s+/).filter(Boolean);
                  if (words.length <= MAX_DESCRIPTION_LENGTH) {
                    setDescription(e.target.value);
                  }
                }}
                placeholder="Descreva o problema comum a estes locais..."
                className="resize-none text-sm"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {description.split(/\s+/).filter(Boolean).length} / {MAX_DESCRIPTION_LENGTH} palavras
              </p>
            </div>
            
            {/* Upload de Imagem */}
            <div className="space-y-1.5">
              <Label htmlFor="image" className="text-xs font-bold">Foto da Ocorrência (Opcional)</Label>
              <Input 
                id="image"
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="h-9 text-xs"
              />
              {imageFile && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative">
                    <img 
                      src={imagePreview || ''} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                      <Layers className="w-3 h-3" />
                    </div>
                  </div>
                  <span className="text-[10px] text-green-600 font-medium truncate max-w-[200px]">
                    {imageFile.name}
                  </span>
                </div>
              )}
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter className="pt-3 border-t mt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={createDemandMutation.isPending || !isFormValid}
            className="w-full h-11 text-base"
          >
            {createDemandMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            Registrar {totalRegistros > 0 ? totalRegistros : ''} Ocorrência{totalRegistros > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDemandDialog;