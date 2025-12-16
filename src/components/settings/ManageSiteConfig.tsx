import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Globe, Image, Upload, X } from 'lucide-react';
import useSiteConfig, { SiteConfig } from '@/hooks/use-site-config';

// Função auxiliar para ler o arquivo como Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Falha ao ler o arquivo'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
};

const ManageSiteConfig: React.FC = () => {
  const { data: config, isLoading, error } = useSiteConfig();
  const queryClient = useQueryClient();
  
  const [siteName, setSiteName] = useState('');
  
  // Estados para Main Background
  const [mainBgFile, setMainBgFile] = useState<File | null>(null);
  const [mainBgPreview, setMainBgPreview] = useState<string | null>(null);
  
  // Estados para Login Background
  const [loginBgFile, setLoginBgFile] = useState<File | null>(null);
  const [loginBgPreview, setLoginBgPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (config) {
      setSiteName(config.site_name);
      // Se não houver um novo arquivo selecionado, use a URL do banco de dados como preview
      if (!mainBgFile) setMainBgPreview(config.main_background_url || null);
      if (!loginBgFile) setLoginBgPreview(config.login_background_url || null);
    }
  }, [config, mainBgFile, loginBgFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showError('A imagem deve ter no máximo 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      setFile(file);
      readFileAsDataURL(file).then(setPreview).catch(() => setPreview(null));
    }
  };
  
  const handleClearFile = (setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>, isMain: boolean) => {
    setFile(null);
    // Se limpar, volta para a URL do banco de dados, ou null se não houver
    if (isMain) {
      setMainBgPreview(config?.main_background_url || null);
    } else {
      setLoginBgPreview(config?.login_background_url || null);
    }
  };

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      
      const isCreating = config?.id === 'fallback_no_data';
      
      if (!config || (!isCreating && !config.id)) {
        throw new Error('Configuração inválida ou não carregada. Verifique se a tabela site_config foi inicializada corretamente.');
      }
      
      let newMainBgUrl = isCreating ? null : config.main_background_url;
      let newLoginBgUrl = isCreating ? null : config.login_background_url;
      
      // Processar upload da imagem principal
      if (mainBgFile) {
        newMainBgUrl = await readFileAsDataURL(mainBgFile);
      } else if (mainBgPreview === null && !isCreating) {
        // Se o preview foi limpo e estamos atualizando um registro existente
        newMainBgUrl = null;
      }
      
      // Processar upload da imagem de login
      if (loginBgFile) {
        newLoginBgUrl = await readFileAsDataURL(loginBgFile);
      } else if (loginBgPreview === null && !isCreating) {
        // Se o preview foi limpo e estamos atualizando um registro existente
        newLoginBgUrl = null;
      }
      
      const payload = {
        site_name: siteName.trim(),
        main_background_url: newMainBgUrl,
        login_background_url: newLoginBgUrl,
      };
      
      if (isCreating) {
        // INSERT the first row
        const { error: insertError } = await supabase
          .from('site_config')
          .insert(payload);
          
        if (insertError) throw insertError;
        
      } else {
        // UPDATE the existing row
        const { error: updateError } = await supabase
          .from('site_config')
          .update(payload)
          .eq('id', config.id);
          
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      showSuccess('Configurações do site atualizadas com sucesso!');
      setMainBgFile(null);
      setLoginBgFile(null);
      // Invalidate para buscar o ID real se foi uma criação
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); // Força refresh do layout
    },
    onError: (error: Error) => {
      showError(error.message || 'Erro ao atualizar configurações.');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      showError('O nome do site não pode ser vazio.');
      return;
    }
    updateConfigMutation.mutate();
  };
  
  if (isLoading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar configurações: {error.message}</div>;
  }
  
  // Componente auxiliar para o campo de upload de imagem
  const ImageUploadField = ({ id, label, file, preview, setFile, setPreview, isMain }: {
    id: string;
    label: string;
    file: File | null;
    preview: string | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setPreview: React.Dispatch<React.SetStateAction<string | null>>;
    isMain: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        <Image className="w-4 h-4 mr-2" />
        {label}
      </Label>
      <div className="flex items-center space-x-2">
        <Input 
          id={id}
          type="file" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, setFile, setPreview)}
          className="flex-1"
        />
        {(file || preview) && (
          <Button 
            variant="outline" 
            size="icon" 
            type="button"
            onClick={() => handleClearFile(setFile, setPreview, isMain)}
          >
            <X className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
      
      {(file || preview) && (
        <div className="mt-2 flex items-center space-x-4">
          {preview && (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-md border"
            />
          )}
          {file && (
            <p className="text-xs text-green-600">Nova imagem selecionada: {file.name}</p>
          )}
          {!file && preview && (
            <p className="text-xs text-muted-foreground">Imagem atual do banco de dados.</p>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Tamanho máximo: 5MB.
      </p>
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center"><Globe className="w-5 h-5 mr-2" /> Configurações do Site</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Nome do Site */}
          <div className="space-y-2">
            <Label htmlFor="site-name">Nome do Site</Label>
            <Input 
              id="site-name"
              value={siteName} 
              onChange={(e) => setSiteName(e.target.value)} 
              placeholder="Ex: Obra Residencial Alpha"
            />
          </div>
          
          {/* Imagem de Fundo Principal */}
          <ImageUploadField
            id="main-bg-upload"
            label="Imagem de Fundo (Principal - Dashboard)"
            file={mainBgFile}
            preview={mainBgPreview}
            setFile={setMainBgFile}
            setPreview={setMainBgPreview}
            isMain={true}
          />
          
          {/* Imagem de Fundo Login */}
          <ImageUploadField
            id="login-bg-upload"
            label="Imagem de Fundo (Login)"
            file={loginBgFile}
            preview={loginBgPreview}
            setFile={setLoginBgFile}
            setPreview={setLoginBgPreview}
            isMain={false}
          />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateConfigMutation.isPending || !siteName.trim()}
              className="w-full sm:w-auto"
            >
              {updateConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManageSiteConfig;