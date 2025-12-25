import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Globe, Image, Footprints } from 'lucide-react';
import useSiteConfig, { SiteConfig } from '@/hooks/use-site-config';

const ManageSiteConfig: React.FC = () => {
  const { data: config, isLoading, error } = useSiteConfig();
  const queryClient = useQueryClient();
  
  const [siteName, setSiteName] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // Estados para URLs de Background
  const [mainBgUrl, setMainBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  
  useEffect(() => {
    if (config) {
      setSiteName(config.site_name);
      setFooterText(config.footer_text || 'Desenvolvido por Dyad'); 
      setMainBgUrl(config.main_background_url || '');
      setLoginBgUrl(config.login_background_url || '');
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      
      const isCreating = config?.id === 'fallback_no_data';
      
      if (!config || (!isCreating && !config.id)) {
        throw new Error('Configuração inválida ou não carregada.');
      }
      
      const payload = {
        site_name: siteName.trim(),
        footer_text: footerText.trim(),
        main_background_url: mainBgUrl.trim() || null,
        login_background_url: loginBgUrl.trim() || null,
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
  
  // Componente auxiliar para o campo de URL de imagem
  const ImageUrlField = ({ id, label, value, setValue }: {
    id: string;
    label: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        <Image className="w-4 h-4 mr-2" />
        {label} (URL)
      </Label>
      <Input 
        id={id}
        type="url" 
        value={value} 
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cole a URL da imagem de fundo aqui (Opcional)"
      />
      
      {value && (
        <div className="mt-2">
          <img 
            src={value} 
            alt="Preview" 
            className="w-24 h-24 object-cover rounded-md border"
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Use URLs de imagens otimizadas para melhor performance.
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
          
          {/* Imagem de Fundo Principal (URL) */}
          <ImageUrlField
            id="main-bg-url"
            label="Imagem de Fundo (Principal - Dashboard)"
            value={mainBgUrl}
            setValue={setMainBgUrl}
          />
          
          {/* Imagem de Fundo Login (URL) */}
          <ImageUrlField
            id="login-bg-url"
            label="Imagem de Fundo (Login)"
            value={loginBgUrl}
            setValue={setLoginBgUrl}
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