import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { uploadFile, deleteFile } from '@/integrations/supabase/storage'; // Importando utilitário de storage

interface CreateDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DESCRIPTION_LENGTH = 400;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_WIDTH = 1200; // Max width for compression

/**
 * Compresses and resizes an image file using the browser's canvas API.
 * @param file The original image file.
 * @returns A new File object (Blob) with reduced size/dimensions.
 */
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
        
        // Resize if width exceeds MAX_IMAGE_WIDTH
        if (width > MAX_IMAGE_WIDTH) {
          height *= MAX_IMAGE_WIDTH / width;
          width = MAX_IMAGE_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert canvas content to Blob (compressed JPEG at 80% quality)
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new File object from the compressed Blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Falha na compactação da imagem.'));
          }
        }, 'image/jpeg', 0.8); // 0.8 is the quality setting (80%)
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const CreateDemandDialog: React.FC<CreateDemandDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const resetForm = () => {
    setBlockId('');
    setApartmentNumber('');
    setServiceTypeId('');
    setRoomId('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
  };
  
  const createDemandMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      // A descrição agora é opcional, mas os outros campos continuam obrigatórios
      if (!blockId || !apartmentNumber || !serviceTypeId || !roomId) {
        throw new Error('Preencha todos os campos obrigatórios (Bloco, Apartamento, Tipo de Serviço, Cômodo).');
      }
      
      let imageUrl: string | null = null;
      
      if (imageFile) {
        // 1. Compactar a imagem antes do upload
        const compressedFile = await compressImage(imageFile);
        
        // 2. Upload para Supabase Storage
        imageUrl = await uploadFile(compressedFile, 'demands');
      }
      
      const { error: insertError } = await supabase
        .from('demands')
        .insert({
          user_id: user.id,
          block_id: blockId,
          apartment_number: apartmentNumber,
          service_type_id: serviceTypeId,
          room_id: roomId,
          description: description || null, // Envia null se estiver vazio
          image_url: imageUrl,
          status: 'Pendente',
        });
        
      if (insertError) throw new Error('Erro ao registrar demanda: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Demanda registrada com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error) => {
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
      
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        showError(`A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      setImageFile(file);
      // Preview da imagem (usando URL.createObjectURL para Base64 temporário)
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  // A descrição agora é opcional, então a validação do formulário só precisa dos outros campos
  const isFormValid = blockId && apartmentNumber && serviceTypeId && roomId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Nova Demanda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="apartment">Apartamento *</Label>
              <Select value={apartmentNumber} onValueChange={setApartmentNumber}>
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
          
          {/* Tipo e Cômodo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço *</Label>
              <Select value={serviceTypeId} onValueChange={setServiceTypeId} disabled={isLoadingConfig}>
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Selecione o Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {configData?.serviceTypes.map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Cômodo *</Label>
              <Select value={roomId} onValueChange={setRoomId} disabled={isLoadingConfig}>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Selecione o Cômodo" />
                </SelectTrigger>
                <SelectContent>
                  {configData?.rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional - Máx. {MAX_DESCRIPTION_LENGTH} palavras)</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(Boolean);
                if (words.length <= MAX_DESCRIPTION_LENGTH) {
                  setDescription(e.target.value);
                }
              }}
              placeholder="Descreva o problema ou a demanda..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.split(/\s+/).filter(Boolean).length} / {MAX_DESCRIPTION_LENGTH} palavras
            </p>
          </div>
          
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label htmlFor="image">Upload de Imagem/Foto (Opcional)</Label>
            <Input 
              id="image"
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            {imageFile && (
              <div className="mt-2">
                <p className="text-xs text-green-600">Arquivo selecionado: {imageFile.name}</p>
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tamanho máximo: {MAX_IMAGE_SIZE_MB}MB. A imagem será compactada para {MAX_IMAGE_WIDTH}px de largura antes do upload.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createDemandMutation.isPending || !isFormValid}
            >
              {createDemandMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Demanda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDemandDialog;