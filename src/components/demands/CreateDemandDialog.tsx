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

interface CreateDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DESCRIPTION_LENGTH = 400;

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
      if (!blockId || !apartmentNumber || !serviceTypeId || !roomId || !description) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }
      
      let imageUrl: string | null = null;
      
      if (imageFile) {
        // Em um ambiente real, aqui você faria uma chamada para seu backend
        // para salvar a imagem localmente e retornar a URL
        // Por enquanto, vamos simular isso criando uma URL base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Falha ao ler o arquivo'));
            }
          };
          reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
          reader.readAsDataURL(imageFile);
        });
        
        imageUrl = fileData;
      }
      
      const { error: insertError } = await supabase
        .from('demands')
        .insert({
          user_id: user.id,
          block_id: blockId,
          apartment_number: apartmentNumber,
          service_type_id: serviceTypeId,
          room_id: roomId,
          description: description,
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
      if (file.size > 5 * 1024 * 1024) {
        showError('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      setImageFile(file);
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
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
              <Label htmlFor="apartment">Apartamento</Label>
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
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
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
              <Label htmlFor="room">Cômodo</Label>
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
            <Label htmlFor="description">Descrição (Máx. {MAX_DESCRIPTION_LENGTH} palavras)</Label>
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
            <Label htmlFor="image">Upload de Imagem/Foto</Label>
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
              Tamanho máximo: 5MB
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createDemandMutation.isPending}
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