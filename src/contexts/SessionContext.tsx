import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  position: string | null;
  avatar_url: string | null;
  can_measure?: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile;
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Inicialização definitiva
    const initialize = async () => {
      // 1. Pega a sessão atual (síncrona do localStorage ou refresh rápido)
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        const userProfile = await fetchProfile(initialSession.user.id);
        if (mounted) setProfile(userProfile);
      }

      // 2. Só agora liberamos o App para renderizar
      setIsLoading(false);

      // 3. Configuramos o listener para mudanças futuras (expiração de token, logout em outra aba)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          if (currentSession) {
            const p = await fetchProfile(currentSession.user.id);
            if (mounted) setProfile(p);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAdmin: profile?.role === 'Admin'
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider');
  }
  return context;
};