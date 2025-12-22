import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Globe, Image, X, Footprints } from 'lucide-react';
import useSiteConfig, { SiteConfig } from '@/hooks/use-site-config';
import { uploadFile, deleteFile } from '@/integrations/supabase/storage'; // Importando utilitário de storage

// Função auxiliar para ler o arquivo como Data URL (apenas para preview local)
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
  const [footerText, setFooterText] = useState(''); // Novo estado para o rodapé
  
  // Estados para Main Background
  const [mainBgFile, setMainBgFile] = useState<File | null>(null);
  const [mainBgPreview, setMainBgPreview] = useState<string | null>(null);
  
  // Estados para Login Background
  const [loginBgFile, setLoginBgFile] = useState<File | null>(null);
  const [loginBgPreview, setLoginBgPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (config) {
      setSiteName(config.site_name);
      // Assumindo que o campo 'footer_text' será adicionado ao schema do Supabase
      // Por enquanto, usaremos um valor padrão se não existir no objeto config
      // Vamos adicionar o campo 'footer_text' ao payload de update/insert
      // Para o estado local, vamos usar um valor padrão se não estiver presente
      setFooterText((config as any).footer_text || 'Desenvolvido por Dyad'); 
      
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
      // Usar URL.createObjectURL para preview local
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleClearFile = async (setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>, currentUrl: string | null, folder: string) => {
    setFile(null);
    setPreview(null);
    
    // Se houver uma URL antiga, deletamos o arquivo do storage
    if (currentUrl) {
      await deleteFile(currentUrl);
    }
  };

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      
      const isCreating = config?.id === 'fallback_no_data';
      
      if (!config || (!isCreating && !config.id)) {
        throw new Error('Configuração inválida ou não carregada. Verifique se a tabela site_config foi inicializada corretamente.');
      }
      
      let newMainBgUrl = config.main_background_url;
      let newLoginBgUrl = config.login_background_url;
      
      // Processar Main Background
      if (mainBgFile) {
        // Se houver um arquivo novo, faz upload e atualiza a URL
        if (config.main_background_url) await deleteFile(config.main_background_url);
        newMainBgUrl = await uploadFile(mainBgFile, 'site-config');
      } else if (mainBgPreview === null && config.main_background_url) {
        // Se o usuário limpou o campo, deleta o arquivo e zera a URL
        await deleteFile(config.main_background_url);
        newMainBgUrl = null;
      }
      
      // Processar Login Background
      if (loginBgFile) {
        // Se houver um arquivo novo, faz upload e atualiza a URL
        if (config.login_background_url) await deleteFile(config.login_background_url);
        newLoginBgUrl = await uploadFile(loginBgFile, 'site-config');
      } else if (loginBgPreview === null && config.login_background_url) {
        // Se o usuário limpou o campo, deleta o arquivo e zera a URL
        await deleteFile(config.login_background_url);
        newLoginBgUrl = null;
      }
      
      const payload = {
        site_name: siteName.trim(),
        footer_text: footerText.trim(), // Incluindo o novo campo
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
      
      // Forçar a revalidação de todos os dados de configuração
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); 
      
      // Forçar um refetch imediato para atualizar o estado local
      queryClient.refetchQueries({ queryKey: ['siteConfig'] });
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
  const ImageUploadField = ({ id, label, file, preview, setFile, setPreview, currentUrl, folder }: {
    id: string;
    label: string;
    file: File | null;
    preview: string | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setPreview: React.Dispatch<React.SetStateAction<string | null>>;
    currentUrl: string | null;
    folder: string;
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
            onClick={() => handleClearFile(setFile, setPreview, currentUrl, folder)}
          >
            <X className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
      
      {(file || preview) && (
        <div className="mt-2 flex items-center space-x-4">
          {preview && (
            <img 
              // Adicionando parâmetros de transformação para otimização (redimensionar para 200px de largura e qualidade 70)
              src={preview.startsWith('http') ? `${preview}?width=200&height=200&quality=70` : preview} 
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
            <Label htmlFor="site-name">Nome do Site (Título da Página e Header)</Label>
            <Input 
              id="site-name"
              value={siteName} 
              onChange={(e) => setSiteName(e.target.value)} 
              placeholder="Ex: Obra Residencial Alpha"
            />
          </div>
          
          {/* Texto do Rodapé */}
          <div className="space-y-2">
            <Label htmlFor="footer-text" className="flex items-center">
              <Footprints className="w-4 h-4 mr-2" />
              Texto do Rodapé (Ex: Direitos Reservados)
            </Label>
            <Input 
              id="footer-text"
              value={footerText} 
              onChange={(e) => setFooterText(e.target.value)} 
              placeholder="Desenvolvido por Dyad"
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
            currentUrl={config.main_background_url}
            folder="site-config"
          />
          
          {/* Imagem de Fundo Login */}
          <ImageUploadField
            id="login-bg-upload"
            label="Imagem de Fundo (Login)"
            file={loginBgFile}
            preview={loginBgPreview}
            setFile={setLoginBgFile}
            setPreview={setLoginBgPreview}
            currentUrl={config.login_background_url}
            folder="site-config"
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