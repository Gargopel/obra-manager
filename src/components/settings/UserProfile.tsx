import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, User, Briefcase, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UserProfile: React.FC = () => {
  const { profile, user } = useSession();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      
      let avatarUrl = profile?.avatar_url || null;
      
      // Upload da imagem se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const filePath = fileName;
        
        // Remover avatar antigo se existir
        if (avatarUrl) {
          const oldFileName = avatarUrl.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([`${user.id}/${oldFileName}`]);
          }
        }
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true
          });
          
        if (uploadError) throw new Error('Erro ao fazer upload do avatar: ' + uploadError.message);
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicUrlData.publicUrl;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          position: position.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      return avatarUrl;
    },
    onSuccess: (newAvatarUrl) => {
      showSuccess('Perfil atualizado com sucesso!');
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
      // Atualizar o contexto de sessão
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };
  
  if (!profile) return null;
  
  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center"><User className="w-5 h-5 mr-2" /> Meu Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview || undefined} alt="Avatar" />
              <AvatarFallback className="text-2xl">
                {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label 
                htmlFor="avatar-upload" 
                className="flex items-center cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                <Camera className="w-4 h-4 mr-2" />
                Alterar Foto
              </Label>
              <Input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarFile && (
                <p className="text-xs text-green-600 mt-1">
                  Nova imagem selecionada: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">Primeiro Nome</Label>
              <Input 
                id="first-name"
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Último Nome</Label>
              <Input 
                id="last-name"
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Cargo
            </Label>
            <Input 
              id="position"
              value={position} 
              onChange={(e) => setPosition(e.target.value)} 
              placeholder="Seu cargo na obra"
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserProfile;