import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import useSiteConfig from '@/hooks/use-site-config';
import React from 'react';

const Login = () => {
  const navigate = useNavigate();
  const { session, isLoading, user } = useSession();
  const { data: siteConfig } = useSiteConfig();
  
  // Hook de bootstrap: tenta promover o usuário se for admin@teste.com
  useAdminBootstrap(user?.email);
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Login';
    }
  }, [siteConfig]);

  // Redireciona se já estiver logado
  if (!isLoading && session) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Usando a URL Base64 ou URL externa diretamente
  const loginBgStyle = siteConfig?.login_background_url 
    ? { backgroundImage: `url(${siteConfig.login_background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 transition-all duration-500" 
      style={loginBgStyle}
    >
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{siteConfig?.site_name || 'Gerenciamento de Obra'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                  },
                },
              },
            }}
            theme="light" // Using light theme for Auth UI, relying on Card background for dark mode effect
            view="sign_in"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Não tem uma conta? Cadastre-se', // Alterado para Cadastre-se
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Cadastrar',
                  link_text: 'Já tem uma conta? Faça login',
                },
                forgotten_password: {
                  link_text: 'Esqueceu sua senha?',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;