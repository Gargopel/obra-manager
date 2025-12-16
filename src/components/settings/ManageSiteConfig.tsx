import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Globe, Image } from 'lucide-react';
import useSiteConfig, { SiteConfig } from '@/hooks/use-site-config';

const ManageSiteConfig: React.FC = () => {
  const { data: config, isLoading, error } = useSiteConfig();
  const queryClient = useQueryClient();
  
  const [siteName, setSiteName] = useState('');
  const [mainBgUrl, setMainBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  
  useEffect(() => {
    if (config) {
      setSiteName(config.site_name);
      setMainBgUrl(config.main_background_url || '');
      setLoginBgUrl(config.login_background_url || '');
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<SiteConfig>) => {
      if (!config?.id) throw new Error('Configuração não encontrada.');
      
      const { error: updateError } = await supabase
        .from('site_config')
        .update({
          site_name: newConfig.site_name,
          main_background_url: newConfig.main_background_url || null,
          login_background_url: newConfig.login_background_url || null,
        })
        .eq('id', config.id);
        
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      showSuccess('Configurações do site atualizadas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
    },
    onError: (error: Error) => {
      showError(error.message || 'Erro ao atualizar configurações.');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate({
      site_name: siteName.trim(),
      main_background_url: mainBgUrl.trim(),
      login_background_url: loginBgUrl.trim(),
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar configurações: {error.message}</div>;
  }
  
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
          <div className="space-y-2">
            <Label htmlFor="main-bg-url" className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              URL da Imagem de Fundo (Principal)
            </Label>
            <Input 
              id="main-bg-url"
              value={mainBgUrl} 
              onChange={(e) => setMainBgUrl(e.target.value)} 
              placeholder="URL da imagem de fundo para o Dashboard"
            />
            {mainBgUrl && (
              <p className="text-xs text-muted-foreground">
                Preview: <a href={mainBgUrl} target="_blank" rel="noopener noreferrer" className="underline">Clique para ver</a>
              </p>
            )}
          </div>
          
          {/* Imagem de Fundo Login */}
          <div className="space-y-2">
            <Label htmlFor="login-bg-url" className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              URL da Imagem de Fundo (Login)
            </Label>
            <Input 
              id="login-bg-url"
              value={loginBgUrl} 
              onChange={(e) => setLoginBgUrl(e.target.value)} 
              placeholder="URL da imagem de fundo para a página de Login"
            />
            {loginBgUrl && (
              <p className="text-xs text-muted-foreground">
                Preview: <a href={loginBgUrl} target="_blank" rel="noopener noreferrer" className="underline">Clique para ver</a>
              </p>
            )}
          </div>
          
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