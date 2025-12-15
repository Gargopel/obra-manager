import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// Email de bootstrap para o primeiro Admin
const BOOTSTRAP_ADMIN_EMAIL = 'admin@teste.com';

export const useAdminBootstrap = (userEmail: string | undefined) => {
  useEffect(() => {
    if (userEmail && userEmail === BOOTSTRAP_ADMIN_EMAIL) {
      // Tenta promover o usuário a Admin usando a função RPC
      const promoteUser = async () => {
        try {
          const { error } = await supabase.rpc('promote_user_to_admin', {
            user_email: BOOTSTRAP_ADMIN_EMAIL,
          });

          if (error) {
            // Se o erro for 'User not found' (o que não deve acontecer aqui) ou outro erro de permissão,
            // apenas logamos. Se for um erro de RLS, a função RPC deve contornar isso.
            console.error('Erro ao promover usuário via RPC:', error.message);
            // Não mostramos erro para o usuário final, pois é uma operação de fundo.
            return;
          }
          
          // Se a promoção for bem-sucedida, forçamos um refresh do perfil
          showSuccess('Usuário Admin de Bootstrap configurado com sucesso! Por favor, recarregue a página.');
          
        } catch (e) {
          console.error('Erro inesperado no bootstrap:', e);
        }
      };
      
      promoteUser();
    }
  }, [userEmail]);
};